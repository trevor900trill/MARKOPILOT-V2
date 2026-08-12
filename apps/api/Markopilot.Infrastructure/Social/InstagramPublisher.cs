using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Social;

/// <summary>
/// Publishes image posts to Instagram via the Instagram Graph API (two-step flow).
/// Step 1: Create a media container with image_url + caption
/// Step 2: Publish the container
/// Requires: Facebook Business Account + Instagram Professional Account + App Review
/// The SocialPost.MediaUrl MUST be populated before this publisher runs.
/// </summary>
public class InstagramPublisher : ISocialPublisher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<InstagramPublisher> _logger;

    public string Platform => "instagram";

    public InstagramPublisher(HttpClient httpClient, ILogger<InstagramPublisher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string> PublishAsync(SocialPost post, string decryptedAccessToken)
    {
        if (string.IsNullOrEmpty(post.MediaUrl))
        {
            throw new InvalidOperationException(
                "Instagram requires media (image). MediaUrl is not set on this post. " +
                "Ensure the SocialPostingWorker generates an image before queuing for Instagram.");
        }

        // The Instagram account ID is stored in the brand's instagram_account_id field.
        // The SocialPublishingWorker passes it via the post's platform-specific data,
        // but we need to extract it from the token query. For now, we'll discover it.
        var igUserId = await GetInstagramUserIdAsync(decryptedAccessToken);

        // Build caption with hashtags
        var caption = post.GeneratedCopy;
        if (post.Hashtags.Count > 0)
        {
            caption += "\n\n" + string.Join(" ", post.Hashtags.Select(h => h.StartsWith("#") ? h : $"#{h}"));
        }

        // ── Step 1: Create Media Container ──────────────────
        var containerUrl = $"https://graph.instagram.com/v21.0/{igUserId}/media";
        var containerPayload = new Dictionary<string, string>
        {
            ["image_url"] = post.MediaUrl,
            ["caption"] = caption,
            ["access_token"] = decryptedAccessToken
        };

        var containerRequest = new HttpRequestMessage(HttpMethod.Post, containerUrl)
        {
            Content = new FormUrlEncodedContent(containerPayload)
        };

        var containerResponse = await _httpClient.SendAsync(containerRequest);
        if (!containerResponse.IsSuccessStatusCode)
        {
            var err = await containerResponse.Content.ReadAsStringAsync();
            _logger.LogError("Instagram Create Container Error: {Error}", err);
            throw new Exception($"Failed to create Instagram media container. Status: {containerResponse.StatusCode}, Detail: {err}");
        }

        var containerJson = await containerResponse.Content.ReadFromJsonAsync<JsonElement>();
        var containerId = containerJson.GetProperty("id").GetString()!;

        _logger.LogInformation("Created Instagram media container: {ContainerId}", containerId);

        // ── Step 1.5: Poll until container is ready ─────────
        // Instagram processes the media asynchronously. We poll status until FINISHED.
        var maxAttempts = 10;
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            await Task.Delay(3000); // Wait 3 seconds between polls

            var statusUrl = $"https://graph.instagram.com/v21.0/{containerId}?fields=status_code&access_token={decryptedAccessToken}";
            var statusResponse = await _httpClient.GetAsync(statusUrl);

            if (statusResponse.IsSuccessStatusCode)
            {
                var statusJson = await statusResponse.Content.ReadFromJsonAsync<JsonElement>();
                if (statusJson.TryGetProperty("status_code", out var statusCode))
                {
                    var status = statusCode.GetString();
                    if (status == "FINISHED") break;
                    if (status == "ERROR")
                    {
                        throw new Exception("Instagram media container processing failed with status ERROR.");
                    }
                    _logger.LogDebug("Instagram container {Id} status: {Status} (attempt {Attempt})", containerId, status, attempt + 1);
                }
            }

            if (attempt == maxAttempts - 1)
            {
                throw new TimeoutException($"Instagram media container {containerId} did not finish processing after {maxAttempts} attempts.");
            }
        }

        // ── Step 2: Publish the Container ───────────────────
        var publishUrl = $"https://graph.instagram.com/v21.0/{igUserId}/media_publish";
        var publishPayload = new Dictionary<string, string>
        {
            ["creation_id"] = containerId,
            ["access_token"] = decryptedAccessToken
        };

        var publishRequest = new HttpRequestMessage(HttpMethod.Post, publishUrl)
        {
            Content = new FormUrlEncodedContent(publishPayload)
        };

        var publishResponse = await _httpClient.SendAsync(publishRequest);
        if (!publishResponse.IsSuccessStatusCode)
        {
            var err = await publishResponse.Content.ReadAsStringAsync();
            _logger.LogError("Instagram Publish Error: {Error}", err);
            throw new Exception($"Failed to publish Instagram post. Status: {publishResponse.StatusCode}, Detail: {err}");
        }

        var publishJson = await publishResponse.Content.ReadFromJsonAsync<JsonElement>();
        var mediaId = publishJson.GetProperty("id").GetString()!;

        _logger.LogInformation("Successfully published Instagram post: {MediaId}", mediaId);
        return mediaId;
    }

    /// <summary>
    /// Discovers the Instagram Business Account ID associated with the access token.
    /// Queries Facebook Graph API for pages connected to the user, then retrieves the
    /// Instagram business account linked to the first page.
    /// </summary>
    private async Task<string> GetInstagramUserIdAsync(string accessToken)
    {
        // Get user's Facebook pages
        var pagesUrl = $"https://graph.facebook.com/v21.0/me/accounts?access_token={accessToken}";
        var pagesResponse = await _httpClient.GetAsync(pagesUrl);
        pagesResponse.EnsureSuccessStatusCode();

        var pagesJson = await pagesResponse.Content.ReadFromJsonAsync<JsonElement>();
        var pages = pagesJson.GetProperty("data");

        if (pages.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("No Facebook Pages found for this account. Instagram publishing requires a linked Facebook Page.");
        }

        var pageId = pages[0].GetProperty("id").GetString()!;

        // Get the Instagram business account linked to this page
        var igUrl = $"https://graph.facebook.com/v21.0/{pageId}?fields=instagram_business_account&access_token={accessToken}";
        var igResponse = await _httpClient.GetAsync(igUrl);
        igResponse.EnsureSuccessStatusCode();

        var igJson = await igResponse.Content.ReadFromJsonAsync<JsonElement>();

        if (igJson.TryGetProperty("instagram_business_account", out var igAccount))
        {
            return igAccount.GetProperty("id").GetString()!;
        }

        throw new InvalidOperationException("No Instagram Business Account linked to the Facebook Page. Connect an Instagram Professional Account to your Page first.");
    }
}
