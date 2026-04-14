namespace Markopilot.Core.Models;

public class Lead
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string? DiscoveredVia { get; set; }
    public string? SourceUrl { get; set; }
    public string? Name { get; set; }
    public string? JobTitle { get; set; }
    public string? Company { get; set; }
    public string? Email { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? TwitterHandle { get; set; }
    public string? Location { get; set; }
    public string? AiSummary { get; set; }
    public int LeadScore { get; set; }
    public string Status { get; set; } = "new";
    public string EmailStatus { get; set; } = "unverified";
    public double EmailConfidence { get; set; }
    public string? EmailSource { get; set; }
    public bool IsCatchAll { get; set; }
    public string? VerificationStatus { get; set; }
    public DateTimeOffset? LastVerifiedAt { get; set; }
    public string? Fingerprint { get; set; }

    /// <summary>
    /// Timestamp of the last email enrichment attempt by EmailEnrichmentWorker.
    /// Used for 30-day cooldown on 'unfindable' leads before retrying.
    /// </summary>
    public DateTimeOffset? EmailEnrichmentAttemptedAt { get; set; }

    public DateTimeOffset DiscoveredAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
