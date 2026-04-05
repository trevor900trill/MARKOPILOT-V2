using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Supabase;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Hangfire recurring job that picks up queued posts where scheduled_for <= NOW()
/// and publishes them via the appropriate platform client.
/// Runs every 5 minutes per spec Section 10.3.
/// </summary>
public class SocialPublishingWorker
{
    private readonly SupabaseRepository _repo;
    private readonly IEnumerable<ISocialPublisher> _publishers;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly ILogger<SocialPublishingWorker> _logger;

    public SocialPublishingWorker(
        SupabaseRepository repo,
        IEnumerable<ISocialPublisher> publishers,
        ITokenEncryptionService encryptionService,
        ILogger<SocialPublishingWorker> logger)
    {
        _repo = repo;
        _publishers = publishers;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessScheduledPostsAsync()
    {
        _logger.LogInformation("SocialPublishingWorker polling for scheduled posts.");

        var posts = await _repo.GetQueuedPostsAsync(limit: 20);

        if (!posts.Any())
        {
            _logger.LogDebug("No queued posts found for current scheduling window.");
            return;
        }

        _logger.LogInformation("Found {Count} queued posts to publish.", posts.Count);

        foreach (var post in posts)
        {
            try
            {
                await PublishSinglePostAsync(post);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish post {PostId} to {Platform}.", post.Id, post.Platform);
                await _repo.UpdatePostStatusAsync(post.Id, "failed", errorMessage: ex.Message);
                await _repo.InsertActivityAsync(post.BrandId, "error",
                    $"Failed to publish post to {post.Platform}: {ex.Message}");
            }
        }
    }

    private async Task PublishSinglePostAsync(SocialPost post)
    {
        var publisher = _publishers.FirstOrDefault(p =>
            p.Platform.Equals(post.Platform, StringComparison.OrdinalIgnoreCase));

        if (publisher == null)
        {
            _logger.LogWarning("No ISocialPublisher found for platform '{Platform}' (Post {PostId}).",
                post.Platform, post.Id);
            await _repo.UpdatePostStatusAsync(post.Id, "failed",
                errorMessage: $"No publisher available for platform: {post.Platform}");
            return;
        }

        // Retrieve the real encrypted OAuth token from the database
        var encryptedToken = await _repo.GetBrandSocialTokenAsync(post.BrandId, post.Platform);

        if (string.IsNullOrEmpty(encryptedToken))
        {
            _logger.LogError("No OAuth token found for {Platform} on brand {BrandId}. Post {PostId} failed.",
                post.Platform, post.BrandId, post.Id);
            await _repo.UpdatePostStatusAsync(post.Id, "failed",
                errorMessage: $"No {post.Platform} OAuth token configured for this brand.");
            await _repo.InsertActivityAsync(post.BrandId, "token_error",
                $"Missing {post.Platform} token — reconnect the platform.");
            return;
        }

        // Decrypt the token
        string rawToken;
        try
        {
            rawToken = _encryptionService.Decrypt(encryptedToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt {Platform} token for brand {BrandId}.", post.Platform, post.BrandId);
            await _repo.UpdatePostStatusAsync(post.Id, "failed", errorMessage: "Token decryption failed.");
            return;
        }

        _logger.LogInformation("Publishing post {PostId} to {Platform}...", post.Id, post.Platform);

        var externalId = await publisher.PublishAsync(post, rawToken);

        _logger.LogInformation("Successfully published post {PostId} to {Platform}. External ID: {ExternalId}",
            post.Id, post.Platform, externalId);

        await _repo.UpdatePostStatusAsync(post.Id, "published", platformPostId: externalId);
        await _repo.InsertActivityAsync(post.BrandId, "post_published",
            $"Published post to {post.Platform}.",
            new Dictionary<string, object>
            {
                ["postId"] = post.Id.ToString(),
                ["platform"] = post.Platform,
                ["platformPostId"] = externalId
            });
    }
}
