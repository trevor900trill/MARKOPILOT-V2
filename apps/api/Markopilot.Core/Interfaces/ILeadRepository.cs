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
    /// <summary>Get paginated leads for a brand with optional status/score filtering.</summary>
    /// <remarks>Used by: API</remarks>
    Task<(List<Lead> Items, int Total)> GetLeadsByBrandAsync(Guid brandId, Guid ownerId, int page, int pageSize, string? status, int? minScore, int? maxScore);

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
}
