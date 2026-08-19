using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Hangfire recurring job that picks up queued posts where scheduled_for <= NOW()
/// and publishes them via the appropriate platform client.
/// Runs every 5 minutes per spec Section 10.3.
/// </summary>
public class SocialPublishingWorker
{
    private readonly ISocialRepository _socialRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly IUserRepository _userRepo;
    private readonly IEnumerable<ISocialPublisher> _publishers;
    private readonly ITokenEncryptionService _encryptionService;
    private readonly IAlertEmailService _alertEmailService;
    private readonly ILogger<SocialPublishingWorker> _logger;

    public SocialPublishingWorker(
        ISocialRepository socialRepo,
        IBrandRepository brandRepo,
        IUserRepository userRepo,
        IEnumerable<ISocialPublisher> publishers,
        ITokenEncryptionService encryptionService,
        IAlertEmailService alertEmailService,
        ILogger<SocialPublishingWorker> logger)
    {
        _socialRepo = socialRepo;
        _brandRepo = brandRepo;
        _userRepo = userRepo;
        _publishers = publishers;
        _encryptionService = encryptionService;
        _alertEmailService = alertEmailService;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessScheduledPostsAsync()
    {
        _logger.LogInformation("SocialPublishingWorker polling for scheduled posts.");

        var posts = await _socialRepo.GetQueuedPostsAsync(limit: 20);

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
                var shortError = TruncateError(ex.Message, 300);
                _logger.LogError(ex, "Failed to publish post {PostId} to {Platform}.", post.Id, post.Platform);
                await _socialRepo.UpdatePostStatusAsync(post.Id, "failed", errorMessage: shortError);
                await _brandRepo.InsertActivityAsync(post.BrandId, "error",
                    $"Failed to publish post to {post.Platform}: {shortError}");

                try
                {
                    var brand = await _brandRepo.GetBrandByIdSystemAsync(post.BrandId);
                    if (brand != null)
                    {
                        var user = await _userRepo.GetUserByIdAsync(brand.OwnerId);
                        if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                        {
                            var dashboardUrl = _brandRepo is Markopilot.Infrastructure.Supabase.SupabaseRepository
                                ? null // let the alert service build the default
                                : null;
                            await _alertEmailService.SendErrorAlertAsync(
                                recipientEmail: user.Email,
                                recipientName: user.DisplayName ?? user.Email,
                                brandName: brand.Name,
                                errorDescription: $"Post to {post.Platform} failed: {shortError}",
                                actionUrl: dashboardUrl);
                        }
                    }
                }
                catch (Exception alertEx)
                {
                    _logger.LogWarning(alertEx, "Failed to dispatch alert email for post {PostId} failure.", post.Id);
                }
            }
        }
    }

    private static string TruncateError(string message, int maxChars)
    {
        if (string.IsNullOrWhiteSpace(message)) return "unknown error";
        if (message.Length <= maxChars) return message;
        return message[..(maxChars - 3)] + "...";
    }

    private async Task PublishSinglePostAsync(SocialPost post)
    {
        var publisher = _publishers.FirstOrDefault(p =>
            p.Platform.Equals(post.Platform, StringComparison.OrdinalIgnoreCase));

        if (publisher == null)
        {
            _logger.LogWarning("No ISocialPublisher found for platform '{Platform}' (Post {PostId}).",
                post.Platform, post.Id);
            await _socialRepo.UpdatePostStatusAsync(post.Id, "failed",
                errorMessage: $"No publisher available for platform: {post.Platform}");
            return;
        }

        // Retrieve the real encrypted OAuth token from the database
        var encryptedToken = await _socialRepo.GetBrandSocialTokenAsync(post.BrandId, post.Platform);

        if (string.IsNullOrEmpty(encryptedToken))
        {
            _logger.LogError("No OAuth token found for {Platform} on brand {BrandId}. Post {PostId} failed.",
                post.Platform, post.BrandId, post.Id);
            await _socialRepo.UpdatePostStatusAsync(post.Id, "failed",
                errorMessage: $"No {post.Platform} OAuth token configured for this brand.");
            await _brandRepo.InsertActivityAsync(post.BrandId, "token_error",
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
            await _socialRepo.UpdatePostStatusAsync(post.Id, "failed", errorMessage: "Token decryption failed.");
            return;
        }

        _logger.LogInformation("Publishing post {PostId} to {Platform}...", post.Id, post.Platform);

        var externalId = await publisher.PublishAsync(post, rawToken);

        _logger.LogInformation("Successfully published post {PostId} to {Platform}. External ID: {ExternalId}",
            post.Id, post.Platform, externalId);

        await _socialRepo.UpdatePostStatusAsync(post.Id, "published", platformPostId: externalId);
        await _brandRepo.InsertActivityAsync(post.BrandId, "post_published",
            $"Published post to {post.Platform}.",
            new Dictionary<string, object>
            {
                ["postId"] = post.Id.ToString(),
                ["platform"] = post.Platform,
                ["platformPostId"] = externalId
            });
    }
}
