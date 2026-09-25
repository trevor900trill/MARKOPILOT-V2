namespace Markopilot.Core.Models;

public class AgentOutcome
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ActionId { get; set; }
    public Guid BrandId { get; set; }
    public string MetricType { get; set; } = "engagement"; // 'engagement', 'reply', 'click', 'conversion', 'open_rate'
    public double MetricValue { get; set; }
    public DateTimeOffset MeasuredAt { get; set; } = DateTimeOffset.UtcNow;
    public string MetadataJson { get; set; } = "{}";
}

public class AgentDashboardMetrics
{
    public int SignalsScannedCount { get; set; }
    public int OpportunitiesFoundCount { get; set; }
    public int ActionsExecutedCount { get; set; }
    public int ActionsPendingApprovalCount { get; set; }
    public double AverageRelevanceScore { get; set; }
    public List<Opportunity> RecentOpportunities { get; set; } = [];
    public List<ActionQueueItem> PendingActions { get; set; } = [];
    public List<ActionQueueItem> RecentActions { get; set; } = [];
    public List<RawSignal> RecentSignals { get; set; } = [];
}
