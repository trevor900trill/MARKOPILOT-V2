using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Data access for brand CRUD, overview stats, and activity logging.
/// Used by: API (BrandsController, SocialController)
///          Workers (LeadExtractionWorker, SocialPostingWorker, SocialPublishingWorker, OutreachWorker)
/// </summary>
public interface IBrandRepository
{
    // ── Create ───────────────────────────────────
    /// <summary>Create a new brand.</summary>
    /// <remarks>Used by: API</remarks>
    Task<Brand> CreateBrandAsync(Brand brand);

    /// <summary>Insert an activity log entry for a brand.</summary>
    /// <remarks>Used by: API (SocialController), Workers (all workers log activity)</remarks>
    Task InsertActivityAsync(Guid brandId, string type, string description, Dictionary<string, object>? metadata = null);

    // ── Read ─────────────────────────────────────
    /// <summary>Get a list of brands by the owner ID (excludes archived).</summary>
    /// <remarks>Used by: API</remarks>
    Task<List<Brand>> GetBrandsByOwnerAsync(Guid ownerId);

    /// <summary>Get a brand by ID with ownership check.</summary>
    /// <remarks>Used by: API</remarks>
    Task<Brand?> GetBrandByIdAsync(Guid brandId, Guid ownerId);

    /// <summary>Get a brand by ID without ownership check (system/worker access).</summary>
    /// <remarks>Used by: Workers</remarks>
    Task<Brand?> GetBrandByIdSystemAsync(Guid brandId);

    /// <summary>Get all brands with outreach automation enabled and Gmail connected.</summary>
    /// <remarks>Used by: Workers (OutreachWorker)</remarks>
    Task<List<Brand>> GetActiveOutreachBrandsAsync();

    /// <summary>Get aggregated dashboard stats (posts published, leads discovered, emails sent).</summary>
    /// <remarks>Used by: API</remarks>
    Task<object> GetBrandOverviewStatsAsync(Guid brandId, Guid ownerId);

    /// <summary>Get paginated activity log entries for a brand.</summary>
    /// <remarks>Used by: API</remarks>
    Task<(List<ActivityLogEntry> Items, int Total)> GetActivityLogAsync(Guid brandId, Guid ownerId, int page, int pageSize, string? type);

    // ── Update ───────────────────────────────────
    /// <summary>Update a brand's settings, voice, pillars, and automation config.</summary>
    /// <remarks>Used by: API</remarks>
    Task<Brand> UpdateBrandAsync(Brand brand);
}
