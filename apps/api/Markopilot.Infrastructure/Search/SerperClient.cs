using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Search;

public class SerperClient : ISearchClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly IGlobalRateLimiter _rateLimiter;
    private readonly ILogger<SerperClient> _logger;

    public string Provider => "serper";

    public SerperClient(HttpClient httpClient, IConfiguration configuration, IGlobalRateLimiter rateLimiter, ILogger<SerperClient> logger)
    {
        _httpClient = httpClient;
        _rateLimiter = rateLimiter;
        _logger = logger;
        _apiKey = configuration["Serper:ApiKey"] ?? string.Empty;

        _httpClient.BaseAddress = new Uri("https://google.serper.dev/");
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-KEY", _apiKey);
        }
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<List<SearchResult>> SearchAsync(string query, int maxResults = 10)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Serper API key missing. Returning empty search results temporarily.");
            return new List<SearchResult>();
        }

        var canProceed = await _rateLimiter.TryAcquireAsync("SerperDev", 300);
        if (!canProceed)
        {
            throw new Exception("SerperDev rate limit exceeded (max 300 per minute).");
        }

        var payload = new { q = query, num = maxResults };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("search", content);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("Serper API Error: {Error}", err);
            throw new Exception($"Failed to fetch results from Serper. Status: {response.StatusCode}, Detailed: {err}");
        }

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        var results = new List<SearchResult>();

        if (resObj.TryGetProperty("organic", out var organicArray))
        {
            foreach (var item in organicArray.EnumerateArray())
            {
                var title = item.TryGetProperty("title", out var t) ? t.GetString() : "";
                var link = item.TryGetProperty("link", out var l) ? l.GetString() : "";
                var snippet = item.TryGetProperty("snippet", out var s) ? s.GetString() : "";

                results.Add(new SearchResult
                {
                    Title = title ?? string.Empty,
                    Url = link ?? string.Empty,
                    Snippet = snippet ?? string.Empty
                });
            }
        }

        return results;
    }
}
