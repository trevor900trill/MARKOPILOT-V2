using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Data access for user profiles, subscriptions, and quota counters.
/// Used by: API (UsersController, WebhooksController, SubscriptionsController)
///          Workers (via QuotaService)
/// </summary>
public interface IUserRepository
{
    // ── Create ───────────────────────────────────
    // (Users are created/upserted via the Auth middleware — see UpsertUserAsync on SupabaseRepository)

    // ── Read ─────────────────────────────────────
    /// <summary>Get a user by their internal ID.</summary>
    Task<User?> GetUserByIdAsync(Guid userId);

    /// <summary>Count the number of non-archived brands owned by a user.</summary>
    /// <remarks>Used by: QuotaService (shared by API + Workers)</remarks>
    Task<int> CountBrandsByOwnerAsync(Guid ownerId);

    // ── Update ───────────────────────────────────
    /// <summary>Increment the post quota usage counter for a user.</summary>
    /// <remarks>Used by: QuotaService → Workers</remarks>
    Task IncrementQuotaPostsUsedAsync(Guid userId, int count = 1);

    /// <summary>Increment the lead quota usage counter for a user.</summary>
    /// <remarks>Used by: QuotaService → Workers</remarks>
    Task IncrementQuotaLeadsUsedAsync(Guid userId, int count = 1);

    /// <summary>Reset both quota counters to zero (on subscription renewal).</summary>
    /// <remarks>Used by: API (WebhooksController)</remarks>
    Task ResetQuotaCountersAsync(Guid userId);

    /// <summary>Mark onboarding as completed or not for a user.</summary>
    /// <remarks>Used by: API (UsersController)</remarks>
    Task UpdateOnboardingStatusAsync(Guid userId, bool completed);

    /// <summary>Update user subscription details and quotas from payment webhook.</summary>
    /// <remarks>Used by: API (WebhooksController)</remarks>
    Task UpdateUserSubscriptionAsync(Guid userId, string subscriptionId, string status,
        string planName, DateTimeOffset? periodEnd, int leadsQuota, int postsQuota, int brandsQuota);
}
