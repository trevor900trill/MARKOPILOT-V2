using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Markopilot.Infrastructure.OpenRouter;

public class ModelRegistryService : IModelRegistryService
{
    private readonly HttpClient _httpClient;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<ModelRegistryService> _logger;
    private readonly string? _apiKey;

    private const string CACHE_KEY = "openrouter:model_registry";
    private const int CACHE_TTL_HOURS = 24;

    private static List<OpenRouterModelItem>? _inMemoryCache;
    private static DateTimeOffset _lastInMemoryUpdate = DateTimeOffset.MinValue;
    private static readonly SemaphoreSlim _refreshLock = new(1, 1);

    public ModelRegistryService(
        HttpClient httpClient,
        IConnectionMultiplexer redis,
        IConfiguration configuration,
        ILogger<ModelRegistryService> logger)
    {
        _httpClient = httpClient;
        _redis = redis;
        _logger = logger;
        _apiKey = configuration["OpenRouter:ApiKey"];

        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }
    }

    public async Task RefreshRegistryAsync()
    {
        await _refreshLock.WaitAsync();
        try
        {
            var url = "https://openrouter.ai/api/v1/models";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to refresh OpenRouter model registry. Status: {Status}, Content: {Error}", response.StatusCode, error);
                return;
            }

            var json = await response.Content.ReadAsStringAsync();
            var parsed = JsonSerializer.Deserialize<OpenRouterModelsResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (parsed?.Data != null && parsed.Data.Count > 0)
            {
                _inMemoryCache = parsed.Data;
                _lastInMemoryUpdate = DateTimeOffset.UtcNow;

                try
                {
                    var db = _redis.GetDatabase();
                    await db.StringSetAsync(CACHE_KEY, json, TimeSpan.FromHours(CACHE_TTL_HOURS));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to cache model registry in Redis, using in-memory cache only.");
                }

                _logger.LogInformation("Successfully refreshed OpenRouter model registry with {Count} models.", parsed.Data.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while refreshing OpenRouter model registry");
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public async Task<string[]> FilterActiveModelsAsync(string[] patterns)
    {
        var models = await GetCachedRegistryAsync();
        if (models.Count == 0)
        {
            // If registry is empty or failed to load, return patterns as-is without wildcards
            return patterns.Where(p => !p.Contains('*')).ToArray();
        }

        var now = DateTimeOffset.UtcNow;
        var activeModels = models.Where(m => !m.IsExpired(now)).ToList();

        var matchedModelIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var pattern in patterns)
        {
            if (pattern.Contains('*'))
            {
                var regex = WildcardToRegex(pattern);
                foreach (var m in activeModels)
                {
                    if (regex.IsMatch(m.Id))
                    {
                        matchedModelIds.Add(m.Id);
                    }
                }
            }
            else
            {
                if (activeModels.Any(m => string.Equals(m.Id, pattern, StringComparison.OrdinalIgnoreCase)))
                {
                    matchedModelIds.Add(pattern);
                }
            }
        }

        return matchedModelIds.ToArray();
    }

    public async Task<ModelPricing?> GetModelPricingAsync(string modelId)
    {
        var models = await GetCachedRegistryAsync();
        return models.FirstOrDefault(m => string.Equals(m.Id, modelId, StringComparison.OrdinalIgnoreCase))?.Pricing;
    }

    public async Task<List<string>> GetDeprecatedModelsAsync(string[] patterns)
    {
        var models = await GetCachedRegistryAsync();
        var now = DateTimeOffset.UtcNow;
        var deprecated = models.Where(m => m.IsExpired(now)).ToList();

        var result = new List<string>();
        foreach (var pattern in patterns)
        {
            var regex = WildcardToRegex(pattern);
            foreach (var m in deprecated)
            {
                if (regex.IsMatch(m.Id) && !result.Contains(m.Id))
                {
                    result.Add(m.Id);
                }
            }
        }
        return result;
    }

    private async Task<List<OpenRouterModelItem>> GetCachedRegistryAsync()
    {
        if (_inMemoryCache != null && _inMemoryCache.Count > 0 && DateTimeOffset.UtcNow - _lastInMemoryUpdate < TimeSpan.FromHours(1))
        {
            return _inMemoryCache;
        }

        try
        {
            var db = _redis.GetDatabase();
            var json = await db.StringGetAsync(CACHE_KEY);

            if (!json.IsNullOrEmpty)
            {
                var parsed = JsonSerializer.Deserialize<OpenRouterModelsResponse>((string)json!, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (parsed?.Data != null && parsed.Data.Count > 0)
                {
                    _inMemoryCache = parsed.Data;
                    _lastInMemoryUpdate = DateTimeOffset.UtcNow;
                    return parsed.Data;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not retrieve model registry from Redis");
        }

        // Trigger refresh if nothing cached
        await RefreshRegistryAsync();
        return _inMemoryCache ?? [];
    }

    private static Regex WildcardToRegex(string pattern)
    {
        var escaped = Regex.Escape(pattern).Replace("\\*", ".*").Replace("\\?", ".");
        return new Regex($"^{escaped}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    }
}
