using Hangfire;
using Hangfire.PostgreSql;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Services;
using Markopilot.Infrastructure.Supabase;
using StackExchange.Redis;

var builder = Host.CreateApplicationBuilder(args);

var connectionString = builder.Configuration["Supabase:Url"]
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
    options.WorkerCount = 20;
});

// ── Services ─────────────────────────────────────
builder.Services.AddSingleton(sp =>
    new SupabaseRepository(connectionString, sp.GetRequiredService<ILogger<SupabaseRepository>>()));

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

var host = builder.Build();
host.Run();
