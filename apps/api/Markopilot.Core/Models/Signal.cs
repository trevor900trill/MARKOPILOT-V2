namespace Markopilot.Core.Models;

public class RawSignal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BrandId { get; set; }
    public SignalSourceType SourceType { get; set; }
    public string? SourceName { get; set; }
    public string? SourceUrl { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string? AuthorProfileUrl { get; set; }
    public string RawMetadataJson { get; set; } = "{}";
    public double? RelevanceScore { get; set; }
    public bool IsProcessed { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset IngestedAt { get; set; } = DateTimeOffset.UtcNow;

    // Enriched fields for action evaluation display
    public Guid? OpportunityId { get; set; }
    public string? OpportunityTitle { get; set; }
    public string? OpportunityReasoning { get; set; }
    public string? OpportunityStatus { get; set; }
}

public class ProcessedSignal
{
    public RawSignal Signal { get; set; } = new();
    public SignalCategory Category { get; set; }
    public double RelevanceScore { get; set; }
    public List<string> ExtractedEntities { get; set; } = [];
    public string Intent { get; set; } = string.Empty;
    public string OpportunityType { get; set; } = string.Empty;
    public SignalUrgency Urgency { get; set; } = SignalUrgency.ActThisWeek;
    public string Reasoning { get; set; } = string.Empty;
}
