using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Markopilot.Core.Services;

/// <summary>
/// Enforces all quota rules per spec Section 6.3.
/// Caches quota in Redis for 5 minutes. Invalidates on mutation.
/// </summary>
public class QuotaService : IQuotaService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IUserRepository _repo;
    private readonly ILogger<QuotaService> _logger;
    private const int CacheTtlMinutes = 5;

    // Plan limits
    private static readonly Dictionary<string, (int Leads, int Posts, int Brands)> PlanLimits = new()
    {
        { "starter", (100, 30, 1) },
        { "growth", (500, 120, 3) },
        { "scale", (2000, int.MaxValue, 10) }
    };

    public QuotaService(IConnectionMultiplexer redis, IUserRepository repo, ILogger<QuotaService> logger)
    {
        _redis = redis;
        _repo = repo;
        _logger = logger;
    }

    public async Task<QuotaStatus> GetQuotaStatusAsync(Guid userId)
    {
        var db = _redis.GetDatabase();
        var cacheKey = $"quota:{userId}";

        var cachedData = await db.StringGetAsync(cacheKey);
        if (cachedData.HasValue)
        {
            try
            {
                var cached = System.Text.Json.JsonSerializer.Deserialize<QuotaStatus>(cachedData.ToString());
                if (cached != null) return cached;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize cached quota for user {UserId}", userId);
            }
        }

        var user = await _repo.GetUserByIdAsync(userId);
        var planName = user?.PlanName ?? "starter";
        
        var leadsUsed = user?.QuotaLeadsUsed ?? 0;
        var postsUsed = user?.QuotaPostsUsed ?? 0;
        var brandsUsed = 0; 
        
        var limits = PlanLimits.TryGetValue(planName, out var limit) ? limit : PlanLimits["starter"];

        var status = new QuotaStatus
        {
            UserId = userId,
            PlanName = planName,
            LeadsAllowed = limits.Leads,
            PostsAllowed = limits.Posts,
            BrandsAllowed = limits.Brands,
            LeadsUsed = leadsUsed,
            PostsUsed = postsUsed,
            BrandsUsed = brandsUsed
        };

        var json = System.Text.Json.JsonSerializer.Serialize(status);
        await db.StringSetAsync(cacheKey, json, TimeSpan.FromMinutes(CacheTtlMinutes));

        return status;
    }

    public async Task<bool> CanGeneratePostAsync(Guid userId)
    {
        var quota = await GetQuotaStatusAsync(userId);
        return !quota.PostsExceeded;
    }

    public async Task<bool> CanDiscoverLeadAsync(Guid userId)
    {
        var quota = await GetQuotaStatusAsync(userId);
        return !quota.LeadsExceeded;
    }

    public async Task IncrementPostsUsedAsync(Guid userId, int count = 1)
    {
        await _repo.IncrementQuotaPostsUsedAsync(userId, count);
        await InvalidateQuotaCacheAsync(userId);
    }

    public async Task IncrementLeadsUsedAsync(Guid userId, int count = 1)
    {
        await _repo.IncrementQuotaLeadsUsedAsync(userId, count);
        await InvalidateQuotaCacheAsync(userId);
    }

    public async Task ResetQuotaAsync(Guid userId)
    {
        await _repo.ResetQuotaCountersAsync(userId);
        await InvalidateQuotaCacheAsync(userId);
        _logger.LogInformation("Quota reset for user {UserId}", userId);
    }

    public string GetQueueForUser(string planName) => planName switch
    {
        "scale" => "scale",
        "growth" => "growth",
        "starter" => "starter",
        _ => "starter"
    };

    public async Task InvalidateQuotaCacheAsync(Guid userId)
    {
        var db = _redis.GetDatabase();
        await db.KeyDeleteAsync($"quota:{userId}");
    }
}
