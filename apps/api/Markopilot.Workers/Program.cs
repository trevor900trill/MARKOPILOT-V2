using Hangfire;
using Hangfire.PostgreSql;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Services;
using Markopilot.Infrastructure.Email;
using Markopilot.Infrastructure.Social;
using Markopilot.Infrastructure.Supabase;
using Markopilot.Workers.Workers;
using StackExchange.Redis;

var builder = Host.CreateApplicationBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=markopilot;Username=postgres;Password=postgres";

var redisConnectionString = builder.Configuration["Redis:ConnectionString"]
    ?? "localhost:6379";

// ── Redis ────────────────────────────────────────
builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(redisConnectionString));

// ── Hangfire ─────────────────────────────────────
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString), new PostgreSqlStorageOptions
    {
        QueuePollInterval = TimeSpan.FromSeconds(5),
        InvisibilityTimeout = TimeSpan.FromMinutes(30),
        DistributedLockTimeout = TimeSpan.FromMinutes(10),
    }));

builder.Services.AddHangfireServer(options =>
{
    options.Queues = ["critical", "scale", "growth", "starter", "default"];
    options.WorkerCount = 5;
});

// ── Services ─────────────────────────────────────
builder.Services.AddHttpClient<IAlertEmailService, ResendAlertEmailService>();

builder.Services.AddSingleton(sp =>
    new SupabaseRepository(
        connectionString,
        sp.GetRequiredService<ILogger<SupabaseRepository>>(),
        sp.GetService<IAlertEmailService>()));
builder.Services.AddSingleton<IUserRepository>(sp => sp.GetRequiredService<SupabaseRepository>());
builder.Services.AddSingleton<IBrandRepository>(sp => sp.GetRequiredService<SupabaseRepository>());
builder.Services.AddSingleton<ISocialRepository>(sp => sp.GetRequiredService<SupabaseRepository>());
builder.Services.AddSingleton<ILeadRepository>(sp => sp.GetRequiredService<SupabaseRepository>());
builder.Services.AddSingleton<IOutreachRepository>(sp => sp.GetRequiredService<SupabaseRepository>());
builder.Services.AddSingleton<INotificationRepository>(sp => sp.GetRequiredService<SupabaseRepository>());
builder.Services.AddSingleton<IEmailPatternRepository>(sp => sp.GetRequiredService<SupabaseRepository>());

builder.Services.AddSingleton<ITokenEncryptionService>(sp =>
{
    var key = builder.Configuration["Encryption:AesKey"] ?? "";
    var iv = builder.Configuration["Encryption:AesIv"] ?? "";
    if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(iv))
    {
        var (genKey, genIv) = TokenEncryptionService.GenerateKeyPair();
        return new TokenEncryptionService(genKey, genIv);
    }
    return new TokenEncryptionService(key, iv);
});

builder.Services.AddSingleton<IGlobalRateLimiter, GlobalRateLimiter>();
builder.Services.AddSingleton<IQuotaService, QuotaService>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.IAiRoutingService, Markopilot.Infrastructure.OpenRouter.AiRoutingService>();
builder.Services.AddSingleton<Markopilot.Core.Interfaces.IContentGenerationService, Markopilot.Infrastructure.AI.ContentGenerationService>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.ISearchClient, Markopilot.Infrastructure.Search.SerperClient>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.ISearchClient, Markopilot.Infrastructure.Search.ExaClient>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.IOutreachService, Markopilot.Infrastructure.Email.OutreachService>();
builder.Services.AddHttpClient<Markopilot.Infrastructure.Search.JinaReaderClient>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.ILeadDiscoveryService, Markopilot.Infrastructure.Services.LeadDiscoveryService>()
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
    });
builder.Services.AddTransient<Markopilot.Core.Interfaces.ILeadExtractionWorker, Markopilot.Workers.Workers.LeadExtractionWorker>();
builder.Services.AddTransient<Markopilot.Core.Interfaces.ISocialPostingWorker, Markopilot.Workers.Workers.SocialPostingWorker>();
builder.Services.AddTransient<Markopilot.Core.Interfaces.IOutreachWorker, Markopilot.Workers.Workers.OutreachWorker>();
builder.Services.AddHttpClient<Markopilot.Infrastructure.Email.HunterIoClient>();
builder.Services.AddTransient<Markopilot.Core.Interfaces.IEmailEnrichmentWorker, Markopilot.Workers.Workers.EmailEnrichmentWorker>();
builder.Services.AddTransient<Markopilot.Core.Interfaces.IBounceProcessorWorker, Markopilot.Workers.Workers.BounceProcessorWorker>();

// ── Social Publishers ────────────────────────────
builder.Services.AddHttpClient<TwitterPublisher>();
builder.Services.AddHttpClient<LinkedInPublisher>();
builder.Services.AddHttpClient<InstagramPublisher>();
builder.Services.AddHttpClient<TikTokPublisher>();
builder.Services.AddSingleton<IEnumerable<ISocialPublisher>>(sp => new ISocialPublisher[]
{
    sp.GetRequiredService<TwitterPublisher>(),
    sp.GetRequiredService<LinkedInPublisher>(),
    sp.GetRequiredService<InstagramPublisher>(),
    sp.GetRequiredService<TikTokPublisher>(),
});

// ── Social Publishing Worker ─────────────────────
builder.Services.AddTransient<SocialPublishingWorker>();

// ── Media Generation ─────────────────────────────
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.IMediaGenerationService, Markopilot.Infrastructure.AI.MediaGenerationService>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.ISupabaseStorageService, Markopilot.Infrastructure.Supabase.SupabaseStorageService>();

// ── Subscription Monitoring ──────────────────────
builder.Services.AddTransient<SubscriptionMonitoringWorker>();

var host = builder.Build();

using (var scope = host.Services.CreateScope())
{
    var jobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    jobManager.AddOrUpdate<Markopilot.Core.Interfaces.IOutreachWorker>(
        "GlobalOutreachWorker",
        worker => worker.ExecuteAsync(),
        "*/30 * * * *");

    // Email enrichment: runs every 10 minutes, picks up leads missing emails
    jobManager.AddOrUpdate<Markopilot.Core.Interfaces.IEmailEnrichmentWorker>(
        "GlobalEmailEnrichmentWorker",
        worker => worker.ExecuteAsync(),
        "*/10 * * * *"); // Every 10 minutes

    // Bounce Processor: runs every 4 hours
    jobManager.AddOrUpdate<Markopilot.Core.Interfaces.IBounceProcessorWorker>(
        "BounceProcessorWorker",
        worker => worker.ExecuteAsync(),
        "0 */4 * * *");

    // Social Publishing: picks up queued posts and publishes every 5 minutes
    jobManager.AddOrUpdate<SocialPublishingWorker>(
        "SocialPublishingWorker",
        worker => worker.ProcessScheduledPostsAsync(),
        "*/5 * * * *");

    // Subscription Monitoring: runs daily to check trial/subscription expiry
    jobManager.AddOrUpdate<Markopilot.Workers.Workers.SubscriptionMonitoringWorker>(
        "SubscriptionMonitoringWorker",
        worker => worker.ExecuteAsync(),
        "0 0 * * *"); // Daily at midnight UTC
}

host.Run();
