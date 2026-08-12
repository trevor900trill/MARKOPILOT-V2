using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Social;

/// <summary>
/// Publishes video posts to TikTok via the TikTok Content Posting API v2.
/// Flow: Initialize upload → upload video chunk → poll for publish status.
/// The SocialPost.MediaUrl MUST point to a video file (MP4).
/// Requires TikTok Developer App Review with video.publish scope.
/// </summary>
public class TikTokPublisher : ISocialPublisher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TikTokPublisher> _logger;

    public string Platform => "tiktok";

    public TikTokPublisher(HttpClient httpClient, ILogger<TikTokPublisher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string> PublishAsync(SocialPost post, string decryptedAccessToken)
    {
        if (string.IsNullOrEmpty(post.MediaUrl))
        {
            throw new InvalidOperationException(
                "TikTok requires video media. MediaUrl is not set on this post. " +
                "Ensure the SocialPostingWorker generates a video before queuing for TikTok.");
        }

        // Build caption with hashtags
        var title = post.GeneratedCopy;
        if (post.Hashtags.Count > 0)
        {
            title += " " + string.Join(" ", post.Hashtags.Select(h => h.StartsWith("#") ? h : $"#{h}"));
        }

        // TikTok has a 150-char title limit for captions
        if (title.Length > 150)
        {
            title = title[..147] + "...";
        }

        // ── Step 1: Initialize Video Upload (Pull from URL) ──
        // Using "PULL_FROM_URL" source so TikTok fetches the video from our Supabase Storage URL
        var initUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";
        var initPayload = new
        {
            post_info = new
            {
                title = title,
                privacy_level = "PUBLIC_TO_EVERYONE",
                disable_duet = false,
                disable_comment = false,
                disable_stitch = false
            },
            source_info = new
            {
                source = "PULL_FROM_URL",
                video_url = post.MediaUrl
            }
        };

        var initRequest = new HttpRequestMessage(HttpMethod.Post, initUrl);
        initRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", decryptedAccessToken);
        initRequest.Content = new StringContent(
            JsonSerializer.Serialize(initPayload),
            Encoding.UTF8,
            "application/json");

        var initResponse = await _httpClient.SendAsync(initRequest);
        if (!initResponse.IsSuccessStatusCode)
        {
            var err = await initResponse.Content.ReadAsStringAsync();
            _logger.LogError("TikTok Init Upload Error: {Error}", err);
            throw new Exception($"Failed to initialize TikTok video upload. Status: {initResponse.StatusCode}, Detail: {err}");
        }

        var initJson = await initResponse.Content.ReadFromJsonAsync<JsonElement>();

        if (!initJson.TryGetProperty("data", out var initData) ||
            !initData.TryGetProperty("publish_id", out var publishIdProp))
        {
            var rawResponse = await initResponse.Content.ReadAsStringAsync();
            throw new Exception($"TikTok init response missing publish_id. Response: {rawResponse}");
        }

        var publishId = publishIdProp.GetString()!;
        _logger.LogInformation("TikTok video upload initialized. Publish ID: {PublishId}", publishId);

        // ── Step 2: Poll for publish status ─────────────────
        // TikTok processes the video asynchronously via PULL_FROM_URL
        var statusUrl = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";
        var maxAttempts = 20; // Video processing can take longer than images

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            await Task.Delay(5000); // Wait 5 seconds between polls

            var statusPayload = new { publish_id = publishId };
            var statusRequest = new HttpRequestMessage(HttpMethod.Post, statusUrl);
            statusRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", decryptedAccessToken);
            statusRequest.Content = new StringContent(
                JsonSerializer.Serialize(statusPayload),
                Encoding.UTF8,
                "application/json");

            var statusResponse = await _httpClient.SendAsync(statusRequest);
            if (!statusResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("TikTok status poll failed (attempt {Attempt}): {Status}",
                    attempt + 1, statusResponse.StatusCode);
                continue;
            }

            var statusJson = await statusResponse.Content.ReadFromJsonAsync<JsonElement>();

            if (statusJson.TryGetProperty("data", out var statusData) &&
                statusData.TryGetProperty("status", out var statusProp))
            {
                var status = statusProp.GetString();

                switch (status)
                {
                    case "PUBLISH_COMPLETE":
                        _logger.LogInformation("TikTok video published successfully. Publish ID: {PublishId}", publishId);
                        return publishId;

                    case "FAILED":
                        var failReason = statusData.TryGetProperty("fail_reason", out var reason)
                            ? reason.GetString()
                            : "unknown";
                        throw new Exception($"TikTok video publishing failed. Reason: {failReason}");

                    default:
                        _logger.LogDebug("TikTok publish status: {Status} (attempt {Attempt})", status, attempt + 1);
                        break;
                }
            }

            if (attempt == maxAttempts - 1)
            {
                throw new TimeoutException($"TikTok video {publishId} did not finish processing after {maxAttempts} attempts.");
            }
        }

        // Fallback — should not reach here due to the loop logic
        return publishId;
    }
}
