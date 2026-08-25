using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Data access for discovered leads.
/// Used by: API (LeadsController)
///          Workers (LeadExtractionWorker, OutreachWorker)
/// </summary>
public interface ILeadRepository
{
    // ── Create ───────────────────────────────────
    /// <summary>Insert multiple qualified leads at once (batch insert with ON CONFLICT DO NOTHING).</summary>
    /// <remarks>Used by: Workers (LeadExtractionWorker)</remarks>
    Task BulkInsertLeadsAsync(List<Lead> leads);

    // ── Read ─────────────────────────────────────
    /// <summary>Get paginated leads for a brand with optional status/score/mode filtering and search.</summary>
    /// <remarks>Used by: API</remarks>
    Task<(List<Lead> Items, int Total)> GetLeadsByBrandAsync(Guid brandId, Guid ownerId, int page = 1, int pageSize = 20, string? status = null, int? minScore = null, int? maxScore = null, string? filterMode = null, string? search = null);

    /// <summary>Get a single lead by ID with ownership check.</summary>
    /// <remarks>Used by: API, Workers (OutreachWorker — to fetch lead data for email generation)</remarks>
    Task<Lead?> GetLeadByIdAsync(Guid brandId, Guid leadId, Guid ownerId);

    /// <summary>Check if a lead with this source URL already exists (deduplication).</summary>
    /// <remarks>Used by: Workers (LeadExtractionWorker)</remarks>
    Task<bool> LeadSourceUrlExistsAsync(Guid brandId, string url);

    /// <summary>Find the most recent extraction of a lead globally (any brand) by fingerprint.</summary>
    /// <remarks>Used by: Workers (LeadExtractionWorker — 7-day global dedup)</remarks>
    Task<Lead?> GetLeadByFingerprintAsync(string fingerprint, TimeSpan maxAge);

    // ── Update ───────────────────────────────────
    /// <summary>Update the status of a lead (e.g., new → contacted → interested → disqualified).</summary>
    /// <remarks>Used by: API, Workers (OutreachWorker — marks leads as 'interested' on reply)</remarks>
    Task UpdateLeadStatusAsync(Guid leadId, string status);

    // ── Delete ───────────────────────────────────
    /// <summary>GDPR delete: removes a lead and all associated outreach emails.</summary>
    /// <remarks>Used by: API</remarks>
    Task DeleteLeadAndOutreachAsync(Guid brandId, Guid leadId, Guid ownerId);

    // ── Email Enrichment ────────────────────────
    /// <summary>
    /// Fetch leads that have no email and are eligible for enrichment.
    /// Skips leads marked 'unfindable' unless 30+ days have passed since last attempt.
    /// </summary>
    /// <remarks>Used by: Workers (EmailEnrichmentWorker)</remarks>
    Task<List<Lead>> GetLeadsNeedingEmailEnrichmentAsync(int limit = 20);

    /// <summary>
    /// Update a lead's email address and all enrichment metadata.
    /// </summary>
    Task UpdateLeadEmailAsync(Guid leadId, string? email, string emailStatus, double confidence, string? source, bool isCatchAll, string? verificationStatus = null);

    /// <summary>
    /// Set the email_enrichment_attempted_at timestamp on a lead.
    /// Used for 30-day cooldown on 'unfindable' leads before retrying.
    /// </summary>
    Task UpdateLeadEmailEnrichmentAttemptedAsync(Guid leadId);
}
