using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Data access for outreach emails and suppression lists.
/// Used by: API (OutreachController, LeadsController)
///          Workers (OutreachWorker)
/// </summary>
public interface IOutreachRepository
{
    // ── Create ───────────────────────────────────
    /// <summary>Create a new outreach email record.</summary>
    Task<OutreachEmail> CreateOutreachEmailAsync(OutreachEmail email);

    /// <summary>Add an email address to the brand's suppression list (unsubscribe).</summary>
    Task AddToSuppressionListAsync(Guid brandId, string email, string reason = "unsubscribed");

    // ── Read ─────────────────────────────────────
    /// <summary>Get queued emails ready for processing by the outreach worker.</summary>
    /// <remarks>Used by: Workers</remarks>
    Task<List<OutreachEmail>> GetQueuedOutreachEmailsToProcessAsync(Guid brandId, int limit = 20);

    /// <summary>Get paginated outreach emails by status (queue/sent view).</summary>
    /// <remarks>Used by: API</remarks>
    Task<(List<OutreachEmail> Items, int Total)> GetOutreachEmailsByBrandAsync(Guid brandId, Guid ownerId, string statusFilter, int page = 1, int pageSize = 20);

    /// <summary>Get a single outreach email by ID with ownership check.</summary>
    /// <remarks>Used by: API</remarks>
    Task<OutreachEmail?> GetOutreachEmailByIdAsync(Guid brandId, Guid emailId, Guid ownerId);

    /// <summary>Check if an email recipient is on the suppression list.</summary>
    /// <remarks>Used by: Workers</remarks>
    Task<bool> IsEmailSuppressedAsync(Guid brandId, string email);

    /// <summary>Get sent emails that haven't been followed up on yet.</summary>
    /// <remarks>Used by: Workers</remarks>
    Task<List<OutreachEmail>> GetEmailsNeedingFollowUpAsync(Guid brandId, int delayDays = 3);

    // ── Update ───────────────────────────────────
    /// <summary>Update the status and metadata of an outreach email (sent, failed, etc.).</summary>
    Task UpdateOutreachEmailStatusAsync(Guid emailId, string status, string? gmailMessageId = null, string? errorMessage = null);

    /// <summary>Update the generated content (subject, body) of an outreach email.</summary>
    /// <remarks>Used by: Workers</remarks>
    Task UpdateOutreachEmailContentAsync(Guid emailId, string subject, string bodyText, string bodyHtml);

    /// <summary>Mark an email as having its follow-up already scheduled.</summary>
    /// <remarks>Used by: Workers</remarks>
    Task MarkFollowUpScheduledAsync(Guid emailId);

    // ── Delete ───────────────────────────────────
    /// <summary>Cancel a queued outreach email (sets status to 'cancelled').</summary>
    /// <remarks>Used by: API</remarks>
    Task CancelOutreachEmailAsync(Guid emailId, Guid ownerId);
}
