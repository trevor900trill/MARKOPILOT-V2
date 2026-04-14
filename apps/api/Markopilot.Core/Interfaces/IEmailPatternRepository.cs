using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Data access for the domain_email_patterns learning cache.
/// Used by: Workers (EmailEnrichmentWorker)
/// </summary>
public interface IEmailPatternRepository
{
    /// <summary>Get the cached email pattern for a domain (e.g. "acme.com" → "{first}.{last}").</summary>
    Task<DomainEmailPattern?> GetPatternByDomainAsync(string domain);

    /// <summary>Upsert a learned pattern with full intelligence metadata.</summary>
    Task UpsertPatternAsync(DomainEmailPattern pattern);

    /// <summary>Increment success or failure count for a specific domain pattern (Feedback Loop).</summary>
    Task RecordOutcomeAsync(string domain, string pattern, bool isSuccess);
    Task<int> GetTotalLearnedDomainsAsync();
}
