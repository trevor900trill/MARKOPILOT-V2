using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Data access for social posts, OAuth tokens, and platform connections.
/// Used by: API (SocialController)
///          Workers (SocialPostingWorker, SocialPublishingWorker)
/// </summary>
public interface ISocialRepository
{
    // ── Create ───────────────────────────────────
    /// <summary>Create a new social post (queued for publishing).</summary>
    /// <remarks>Used by: API, Workers (SocialPostingWorker)</remarks>
    Task<SocialPost> CreatePostAsync(SocialPost post);

    // ── Read ─────────────────────────────────────
    /// <summary>Get paginated posts for a brand (dashboard view).</summary>
    /// <remarks>Used by: API</remarks>
    Task<List<SocialPost>> GetPostsByBrandAsync(Guid brandId, Guid ownerId, int page, int pageSize);

    /// <summary>Get queued posts where scheduled_for ≤ now (ready for publishing).</summary>
    /// <remarks>Used by: Workers (SocialPublishingWorker)</remarks>
    Task<List<SocialPost>> GetQueuedPostsAsync(int limit);

    /// <summary>Get the encrypted OAuth token for a specific brand and platform.</summary>
    /// <remarks>Used by: Workers (SocialPublishingWorker)</remarks>
    Task<string?> GetBrandSocialTokenAsync(Guid brandId, string platform);

    // ── Update ───────────────────────────────────
    /// <summary>Update OAuth tokens and connection status after callback.</summary>
    /// <remarks>Used by: API (SocialController OAuth callback)</remarks>
    Task UpdateBrandSocialTokenAsync(Guid brandId, string platform, string encryptedToken, string? encryptedRefresh, DateTimeOffset? expiresAt, string? username, bool connected);

    /// <summary>Update the status, external ID, or error of a published post.</summary>
    /// <remarks>Used by: Workers (SocialPublishingWorker)</remarks>
    Task UpdatePostStatusAsync(Guid postId, string status, string? platformPostId = null, string? errorMessage = null);

    // ── Delete ───────────────────────────────────
    /// <summary>Cancel a queued post (only if still 'queued').</summary>
    /// <remarks>Used by: API</remarks>
    Task CancelPostAsync(Guid postId, Guid ownerId);

    /// <summary>Disconnect a social platform, clearing tokens and setting connected to false.</summary>
    /// <remarks>Used by: API</remarks>
    Task DisconnectBrandPlatformAsync(Guid brandId, Guid ownerId, string platform);
}
