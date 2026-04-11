using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Search;

public class ExaClient : ISearchClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly IGlobalRateLimiter _rateLimiter;
    private readonly ILogger<ExaClient> _logger;

    public string Provider => "exa";

    public ExaClient(HttpClient httpClient, IConfiguration configuration, IGlobalRateLimiter rateLimiter, ILogger<ExaClient> logger)
    {
        _httpClient = httpClient;
        _rateLimiter = rateLimiter;
        _logger = logger;
        _apiKey = configuration["Exa:ApiKey"] ?? string.Empty;

        _httpClient.BaseAddress = new Uri("https://api.exa.ai/");
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<List<SearchResult>> SearchAsync(string query, int maxResults = 10)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Exa API key missing. Returning empty search results temporarily.");
            return new List<SearchResult>();
        }

        var canProceed = await _rateLimiter.TryAcquireAsync("ExaAi", 100);
        if (!canProceed)
        {
            throw new Exception("ExaAi rate limit exceeded (max 100 per minute).");
        }

        var payload = new 
        { 
            query = query, 
            numResults = maxResults, 
            type = "neural",
            contents = new { text = new { maxCharacters = 5000 } }
        };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("search", content);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("Exa API Error: {Error}", err);
            throw new Exception($"Failed to fetch results from Exa. Status: {response.StatusCode}, Detailed: {err}");
        }

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        var results = new List<SearchResult>();

        if (resObj.TryGetProperty("results", out var resultsArray))
        {
            foreach (var item in resultsArray.EnumerateArray())
            {
                var title = item.TryGetProperty("title", out var t) ? t.GetString() : "";
                var url = item.TryGetProperty("url", out var u) ? u.GetString() : "";
                var summary = item.TryGetProperty("text", out var tx) ? tx.GetString() : "";
                
                // Exa returns full content in the results[].text field if contents.text is true
                // In some versions it might be under results[].contents.text, checking both
                string? rawContent = summary;
                if (item.TryGetProperty("contents", out var contentsObj))
                {
                    if (contentsObj.TryGetProperty("text", out var fullText))
                    {
                        rawContent = fullText.GetString();
                    }
                }

                results.Add(new SearchResult
                {
                    Title = title ?? string.Empty,
                    Url = url ?? string.Empty,
                    Snippet = summary ?? string.Empty,
                    RawContent = rawContent
                });
            }
        }

        return results;
    }
}
