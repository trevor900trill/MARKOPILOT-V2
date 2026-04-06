using Hangfire;
using Hangfire.PostgreSql;
using Markopilot.Api.Middleware;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Services;
using Markopilot.Infrastructure.Supabase;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration ────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=markopilot;Username=postgres;Password=postgres";

var redisConnectionString = builder.Configuration["Redis:ConnectionString"]
    ?? "localhost:6379";

// ── CORS ─────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

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


// ── Services ─────────────────────────────────────
builder.Services.AddSingleton(sp =>
    new SupabaseRepository(connectionString, sp.GetRequiredService<ILogger<SupabaseRepository>>()));
builder.Services.AddSingleton<IUserRepository>(sp => sp.GetRequiredService<SupabaseRepository>());

builder.Services.AddSingleton<ITokenEncryptionService>(sp =>
{
    var key = builder.Configuration["Encryption:AesKey"] ?? "";
    var iv = builder.Configuration["Encryption:AesIv"] ?? "";
    if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(iv))
    {
        // Generate and log keys for first-time setup
        var (genKey, genIv) = TokenEncryptionService.GenerateKeyPair();
        sp.GetRequiredService<ILogger<TokenEncryptionService>>()
            .LogWarning("No encryption keys configured. Generated keys — set Encryption:AesKey={Key} and Encryption:AesIv={Iv}", genKey, genIv);
        return new TokenEncryptionService(genKey, genIv);
    }
    return new TokenEncryptionService(key, iv);
});

builder.Services.AddSingleton<IGlobalRateLimiter, GlobalRateLimiter>();
builder.Services.AddSingleton<IQuotaService, QuotaService>();
builder.Services.AddHttpClient<Markopilot.Infrastructure.Social.OAuthService>();
builder.Services.AddSingleton<Markopilot.Core.Interfaces.IContentGenerationService, Markopilot.Infrastructure.AI.ContentGenerationService>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.ISearchClient, Markopilot.Infrastructure.Search.SerperClient>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.ISearchClient, Markopilot.Infrastructure.Search.ExaClient>();
builder.Services.AddHttpClient<Markopilot.Infrastructure.LemonSqueezy.LemonSqueezyClient>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.IAiRoutingService, Markopilot.Infrastructure.OpenRouter.AiRoutingService>();
builder.Services.AddHttpClient<Markopilot.Core.Interfaces.ILeadDiscoveryService, Markopilot.Infrastructure.Services.LeadDiscoveryService>();


// ── API ──────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// ── Rate limiting (via Redis GlobalRateLimiter for external APIs) ──
// Per-user API rate limiting is handled at the middleware level.
// 60 req/min standard, 10 req/min for trigger endpoints (enforced in controllers).

var app = builder.Build();

// ── Middleware pipeline ──────────────────────────
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<AuthMiddleware>();
app.UseHangfireDashboard("/hangfire");
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTimeOffset.UtcNow }));

app.Run();
