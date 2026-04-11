using System;

namespace Markopilot.Core.Models;

/// <summary>
/// Tracks the performance of specific search queries to provide a feedback loop for the AI.
/// Per spec: used to bias future query generation toward successful patterns.
/// </summary>
public class SearchQueryHistory
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string QueryText { get; set; } = string.Empty;
    public int LeadsGenerated { get; set; }
    public int HighQualityCount { get; set; } // Leads with score > 60
    public double AverageLeadScore { get; set; }
    public DateTimeOffset LastRunAt { get; set; } = DateTimeOffset.UtcNow;
}
