namespace Markopilot.Core.Models;

public class Opportunity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BrandId { get; set; }
    public Guid? SignalId { get; set; }
    public SignalCategory Category { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Reasoning { get; set; } = string.Empty;
    public double RelevanceScore { get; set; }
    public SignalUrgency Urgency { get; set; } = SignalUrgency.ActThisWeek;
    public OpportunityStatus Status { get; set; } = OpportunityStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Optional navigation/hydrated signal
    public RawSignal? Signal { get; set; }
}

public class ActionQueueItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BrandId { get; set; }
    public Guid? OpportunityId { get; set; }
    public ActionType ActionType { get; set; }
    public int Priority { get; set; } = 3; // 1 = highest, 5 = lowest
    public string Reasoning { get; set; } = string.Empty;
    public string DraftContentJson { get; set; } = "{}";
    public string TargetEntityJson { get; set; } = "{}";
    public bool ApprovalRequired { get; set; } = true;
    public ActionQueueStatus Status { get; set; } = ActionQueueStatus.Pending;
    public DateTimeOffset? ScheduledFor { get; set; }
    public DateTimeOffset? ExecutedAt { get; set; }
    public string ResultJson { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Optional hydrated opportunity
    public Opportunity? Opportunity { get; set; }
}

public class AgentActionResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
    public Dictionary<string, object> Details { get; set; } = [];
}
