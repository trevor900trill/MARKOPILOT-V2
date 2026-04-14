namespace Markopilot.Core.Models;

public class Brand
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? WebsiteUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string Industry { get; set; } = string.Empty;
    public string? IndustryCustom { get; set; }
    public string? TargetAudienceDescription { get; set; }
    public List<string> TargetJobTitles { get; set; } = [];
    public List<string> TargetPainPoints { get; set; } = [];
    public List<string> TargetGeographies { get; set; } = [];
    public string BrandVoiceFormality { get; set; } = "professional";
    public string BrandVoiceHumour { get; set; } = "subtle";
    public string BrandVoiceAssertiveness { get; set; } = "balanced";
    public string BrandVoiceEmpathy { get; set; } = "medium";
    public List<string> ContentPillars { get; set; } = [];
    public bool AutomationPostsEnabled { get; set; } = true;
    public int AutomationPostsPerWeek { get; set; } = 5;
    public List<string> AutomationPostingDays { get; set; } = ["monday", "wednesday", "friday"];
    public string AutomationPostingTimeUtc { get; set; } = "08:00";
    public bool AutomationLeadsEnabled { get; set; } = true;
    public int AutomationLeadsPerDay { get; set; } = 10;
    public bool AutomationOutreachEnabled { get; set; } = true;
    public int AutomationOutreachDelayHours { get; set; } = 4;
    public int AutomationOutreachDailyLimit { get; set; } = 20;
    public string? BusinessAddress { get; set; }

    // Social tokens (stored encrypted)
    public string? TwitterAccessToken { get; set; }
    public string? TwitterRefreshToken { get; set; }
    public DateTimeOffset? TwitterTokenExpiresAt { get; set; }
    public string? TwitterUsername { get; set; }
    public bool TwitterConnected { get; set; }

    public string? LinkedinAccessToken { get; set; }
    public string? LinkedinRefreshToken { get; set; }
    public DateTimeOffset? LinkedinTokenExpiresAt { get; set; }
    public string? LinkedinProfileName { get; set; }
    public bool LinkedinConnected { get; set; }

    public string? InstagramAccessToken { get; set; }
    public string? InstagramAccountId { get; set; }
    public string? InstagramUsername { get; set; }
    public bool InstagramConnected { get; set; }

    public string? TiktokAccessToken { get; set; }
    public string? TiktokRefreshToken { get; set; }
    public DateTimeOffset? TiktokTokenExpiresAt { get; set; }
    public string? TiktokUsername { get; set; }
    public bool TiktokConnected { get; set; }

    public string? GmailAccessToken { get; set; }
    public string? GmailRefreshToken { get; set; }
    public DateTimeOffset? GmailTokenExpiresAt { get; set; }
    public string? GmailEmail { get; set; }
    public bool GmailConnected { get; set; }
    public DateTimeOffset? LastBounceCheckAt { get; set; }

    public string Status { get; set; } = "active";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
