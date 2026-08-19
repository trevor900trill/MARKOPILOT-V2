using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Social;

/// <summary>
/// Publishes text posts to LinkedIn via the UGC Posts API v2.
/// LinkedIn posts are text-only per design decision (no media upload).
/// Requires scope: w_member_social, profile
/// </summary>
public class LinkedInPublisher : ISocialPublisher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LinkedInPublisher> _logger;

    public string Platform => "linkedin";

    public LinkedInPublisher(HttpClient httpClient, ILogger<LinkedInPublisher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _httpClient.BaseAddress = new Uri("https://api.linkedin.com/");
    }

    public async Task<string> PublishAsync(SocialPost post, string decryptedAccessToken)
    {
        // First, get the authenticated user's LinkedIn URN
        var userUrn = await GetUserUrnAsync(decryptedAccessToken);

        var request = new HttpRequestMessage(HttpMethod.Post, "v2/ugcPosts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", decryptedAccessToken);
        request.Headers.Add("X-Restli-Protocol-Version", "2.0.0");

        // Build the UGC post payload
        var fullText = post.GeneratedCopy;
        if (post.Hashtags.Count > 0)
        {
            fullText += "\n\n" + string.Join(" ", post.Hashtags.Select(h => h.StartsWith("#") ? h : $"#{h}"));
        }

        var payload = new Dictionary<string, object>
        {
            ["author"] = userUrn,
            ["lifecycleState"] = "PUBLISHED",
            ["specificContent"] = new Dictionary<string, object>
            {
                ["com.linkedin.ugc.ShareContent"] = new Dictionary<string, object>
                {
                    ["shareCommentary"] = new Dictionary<string, object> { ["text"] = fullText },
                    ["shareMediaCategory"] = "NONE"
                }
            },
            ["visibility"] = new Dictionary<string, object>
            {
                ["com.linkedin.ugc.MemberNetworkVisibility"] = "PUBLIC"
            }
        };

        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("LinkedIn API Error: {Error}", err);
            throw new Exception($"Failed to publish to LinkedIn. Status: {response.StatusCode}, Detail: {err}");
        }

        // LinkedIn returns the post URN in the 'id' field or the X-RestLi-Id header
        var headerPostId = response.Headers.TryGetValues("X-RestLi-Id", out var headerValues)
            ? headerValues.FirstOrDefault()
            : null;

        if (!string.IsNullOrEmpty(headerPostId))
            return headerPostId;

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        return resObj.TryGetProperty("id", out var idProp) ? idProp.GetString()! : "linkedin-published";
    }

    private async Task<string> GetUserUrnAsync(string accessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "v2/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        // userinfo returns a "sub" field which is the LinkedIn member ID
        if (json.TryGetProperty("sub", out var sub))
        {
            return $"urn:li:person:{sub.GetString()}";
        }

        throw new Exception("Could not resolve LinkedIn user URN from userinfo endpoint.");
    }
}
