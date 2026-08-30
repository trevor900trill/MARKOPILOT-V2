namespace Markopilot.Core.Models;

public class IntelligenceSource
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? FeedUrl { get; set; }
    public string SourceType { get; set; } = "rss"; // 'rss', 'search_sweep', 'api_blog', 'gov_feed'
    public string Category { get; set; } = "tech";
    public List<string> TargetIndustries { get; set; } = [];
    public int TrustScore { get; set; } = 85;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastScrapedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class IntelligenceArticle
{
    public Guid Id { get; set; }
    public Guid? SourceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? ContentSnippet { get; set; }
    public string? FullContent { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public List<string> Tags { get; set; } = [];
    public List<string> IndustryCategories { get; set; } = [];
    public List<string> KeyEntities { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class BrandImpactEvent
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public Guid? ArticleId { get; set; }
    public string ImpactLevel { get; set; } = "info"; // 'critical', 'high', 'moderate', 'low', 'info'
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string WhyItMatters { get; set; } = string.Empty;
    public string RecommendedAction { get; set; } = string.Empty;
    public string? AutoDraftHook { get; set; }
    public string? SourceUrl { get; set; }
    public string? SourceName { get; set; }
    public string Status { get; set; } = "unread"; // 'unread', 'read', 'actioned', 'dismissed'
    public Guid? ActionedPostId { get; set; }
    public bool EmailAlertSent { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class BrandImpactSummaryDto
{
    public int TotalEvents { get; set; }
    public int CriticalEvents { get; set; }
    public int HighEvents { get; set; }
    public int UnreadEvents { get; set; }
    public string ScanFrequency { get; set; } = "Daily";
    public DateTimeOffset? LastScannedAt { get; set; }
    public List<BrandImpactEvent> RecentEvents { get; set; } = [];
}
