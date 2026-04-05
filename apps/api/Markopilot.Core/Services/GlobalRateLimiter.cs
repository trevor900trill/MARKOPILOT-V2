using Markopilot.Core.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Markopilot.Core.Services;

/// <summary>
/// Redis-backed sliding window rate limiter with circuit breaker pattern.
/// Enforces global rate limits across all worker instances.
/// Per spec Section 7.3.
/// </summary>
public class GlobalRateLimiter : IGlobalRateLimiter
{
    // Rate limit keys — global across ALL worker instances
    public const string SerperDev = "rate:serper:global";          // 300 req/min
    public const string ExaAi = "rate:exa:global";                 // 100 req/min
    public const string GroqOpenRouter = "rate:or:groq:global";    // 500 req/min
    public const string GoogleOpenRouter = "rate:or:google:global"; // 100 req/min
    public const string GmailSend = "rate:gmail:global";           // 250 units/sec

    // Circuit breaker keys
    private const string CircuitPrefix = "circuit:";
    private const int CircuitBreakerThreshold = 5;
    private const int CircuitBreakerCooldownSeconds = 60;

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<GlobalRateLimiter> _logger;

    public GlobalRateLimiter(IConnectionMultiplexer redis, ILogger<GlobalRateLimiter> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    /// <summary>
    /// Attempts to acquire a rate limit slot using sliding window counter.
    /// Returns false if the rate limit is exceeded — caller should retry with backoff.
    /// </summary>
    public async Task<bool> TryAcquireAsync(string key, int ratePerMinute)
    {
        var db = _redis.GetDatabase();
        var windowKey = $"{key}:{DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60}";

        var current = await db.StringIncrementAsync(windowKey);

        if (current == 1)
        {
            // First request in this window — set TTL
            await db.KeyExpireAsync(windowKey, TimeSpan.FromSeconds(120));
        }

        if (current > ratePerMinute)
        {
            _logger.LogWarning("Rate limit exceeded for {Key}: {Current}/{Limit}", key, current, ratePerMinute);
            return false;
        }

        return true;
    }

    /// <summary>
    /// Checks if the circuit breaker is open for a given service.
    /// Open = too many consecutive failures, requests should be halted.
    /// </summary>
    public async Task<bool> IsCircuitOpenAsync(string serviceKey)
    {
        var db = _redis.GetDatabase();
        var circuitKey = $"{CircuitPrefix}{serviceKey}";

        var state = await db.StringGetAsync(circuitKey);
        return state.HasValue && state == "open";
    }

    /// <summary>
    /// Records a failure and potentially opens the circuit breaker.
    /// After 5 consecutive failures, circuit opens for 60 seconds.
    /// </summary>
    public async Task RecordFailureAsync(string serviceKey)
    {
        var db = _redis.GetDatabase();
        var failureKey = $"{CircuitPrefix}{serviceKey}:failures";

        var failures = await db.StringIncrementAsync(failureKey);
        await db.KeyExpireAsync(failureKey, TimeSpan.FromSeconds(300));

        if (failures >= CircuitBreakerThreshold)
        {
            var circuitKey = $"{CircuitPrefix}{serviceKey}";
            await db.StringSetAsync(circuitKey, "open", TimeSpan.FromSeconds(CircuitBreakerCooldownSeconds));
            _logger.LogWarning("Circuit breaker OPENED for {Service} after {Failures} consecutive failures. Cooldown: {Seconds}s",
                serviceKey, failures, CircuitBreakerCooldownSeconds);
        }
    }

    /// <summary>
    /// Records a success and resets the failure counter.
    /// </summary>
    public async Task RecordSuccessAsync(string serviceKey)
    {
        var db = _redis.GetDatabase();
        var failureKey = $"{CircuitPrefix}{serviceKey}:failures";
        await db.KeyDeleteAsync(failureKey);
    }
}
