namespace Markopilot.Core.Models;

public class Subscription
{
    public string PlanName { get; set; } = "starter";
    public string Status { get; set; } = "trialing";
    public string? LemonSqueezySubscriptionId { get; set; }
    public DateTimeOffset? CurrentPeriodEnd { get; set; }
    public int QuotaLeadsPerMonth { get; set; } = 100;
    public int QuotaPostsPerMonth { get; set; } = 30;
    public int QuotaBrandsAllowed { get; set; } = 1;
}

public class ActivityLogEntry
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool Read { get; set; }
    public string? ActionUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class SuppressionEntry
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Reason { get; set; } = "unsubscribed";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
