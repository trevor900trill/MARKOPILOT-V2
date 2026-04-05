using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Social;

public class TwitterPublisher : ISocialPublisher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TwitterPublisher> _logger;

    public string Platform => "x";

    public TwitterPublisher(HttpClient httpClient, ILogger<TwitterPublisher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _httpClient.BaseAddress = new Uri("https://api.twitter.com/2/");
    }

    public async Task<string> PublishAsync(SocialPost post, string decryptedAccessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "tweets");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", decryptedAccessToken);

        // Twitter v2 expects {"text": "the content"}
        var payload = new { text = post.GeneratedCopy };
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("Twitter API Error: {Error}", err);
            throw new Exception($"Failed to publish to X. Status: {response.StatusCode}, Detailed: {err}");
        }

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        return resObj.GetProperty("data").GetProperty("id").GetString()!;
    }
}
