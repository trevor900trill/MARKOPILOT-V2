namespace Markopilot.Core.Models;

public class User
{
    public Guid Id { get; set; }
    public string GoogleId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? PhotoUrl { get; set; }
    public bool OnboardingCompleted { get; set; }
    public string? SubscriptionId { get; set; }
    public string SubscriptionStatus { get; set; } = "trialing";
    public string PlanName { get; set; } = "starter";
    public DateTimeOffset? CurrentPeriodEnd { get; set; }
    public int QuotaLeadsPerMonth { get; set; } = 100;
    public int QuotaPostsPerMonth { get; set; } = 30;
    public int QuotaBrandsAllowed { get; set; } = 1;
    public int QuotaLeadsUsed { get; set; }
    public int QuotaPostsUsed { get; set; }
    public DateTimeOffset? QuotaResetDate { get; set; }
    public string Status { get; set; } = "active";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
