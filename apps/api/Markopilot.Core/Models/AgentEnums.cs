namespace Markopilot.Core.Models;

public enum AgentAutonomyLevel
{
    FullAuto,
    ApproveOutreach,
    ApproveAll
}

public enum SignalSourceType
{
    Rss,
    WebSearch,
    Reddit,
    TwitterMention,
    CompetitorDiff,
    GoogleTrends
}

public enum SignalCategory
{
    CreatorOpportunity,
    CompetitorMove,
    MarketTrend,
    BrandMention,
    IndustryEvent,
    PartnershipLead,
    ContentInspiration,
    ThreatAlert,
    CustomerConversation,
    FundingNews
}

public enum SignalUrgency
{
    ActNow,
    ActToday,
    ActThisWeek,
    Monitor
}

public enum ActionType
{
    DraftReactivePost,
    DraftReplyToCreator,
    IdentifyAndReachCreator,
    CreateOutreachCampaign,
    ScheduleContentSeries,
    SendOutreachEmail,
    UpdateLeadScore,
    NotifyHuman,
    AddToWatchlist,
    DraftBlogPost
}

public enum OpportunityStatus
{
    Pending,
    Planning,
    Planned,
    Expired,
    Dismissed
}

public enum ActionQueueStatus
{
    Pending,
    Approved,
    Executing,
    Completed,
    Failed,
    Rejected
}
