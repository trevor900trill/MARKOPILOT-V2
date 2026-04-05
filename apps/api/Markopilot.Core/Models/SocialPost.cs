namespace Markopilot.Core.Models;

public class SocialPost
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string? ContentPillar { get; set; }
    public string GeneratedCopy { get; set; } = string.Empty;
    public List<string> Hashtags { get; set; } = [];
    public string? MediaUrl { get; set; }
    public DateTimeOffset ScheduledFor { get; set; }
    public string Status { get; set; } = "queued";
    public DateTimeOffset? PublishedAt { get; set; }
    public string? PlatformPostId { get; set; }
    public int EngagementLikes { get; set; }
    public int EngagementComments { get; set; }
    public int EngagementReposts { get; set; }
    public int EngagementImpressions { get; set; }
    public DateTimeOffset? EngagementFetchedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
}
