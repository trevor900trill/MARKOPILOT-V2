using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Search;

/// <summary>
/// Uses r.jina.ai to fetch cleaned, LLM-friendly markdown content from any URL.
/// This bypasses common bot-detection (like 999 errors) and improves extraction quality.
/// </summary>
public class JinaReaderClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<JinaReaderClient> _logger;

    public JinaReaderClient(HttpClient httpClient, ILogger<JinaReaderClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        // Jina Reader is a free public API for text extraction
        _httpClient.BaseAddress = new Uri("https://r.jina.ai/");
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
    }

    public async Task<string?> FetchContentAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;

        try
        {
            _logger.LogInformation("Safe scraping via Jina Reader: {Url}", url);
            // r.jina.ai/<url> returns the markdown content
            var response = await _httpClient.GetAsync(url);
            
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }

            _logger.LogWarning("Jina Reader failed for {Url}. Status: {StatusCode}", url, response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching content via Jina Reader for {Url}", url);
            return null;
        }
    }
}
