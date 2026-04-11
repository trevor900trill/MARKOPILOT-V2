namespace Markopilot.Core.Models;

public enum AiTask
{
    LeadQueryGeneration,
    EntityExtraction,
    LeadScoring,
    SocialPostGeneration,
    EmailOutreachCopy,
    ContentPillarSuggestion,
    OnboardingEnhancement
}

public enum SocialPlatform
{
    Twitter,
    LinkedIn,
    Instagram,
    TikTok
}

public class AiCompletionRequest
{
    public AiTask Task { get; set; }
    public string SystemPrompt { get; set; } = string.Empty;
    public string UserPrompt { get; set; } = string.Empty;
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 2048;
}

public class AiCompletionResponse
{
    public string Content { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
}

public class SearchResult
{
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public string? RawContent { get; set; }
}

public class ExtractedEntity
{
    public string? Name { get; set; }
    public string? JobTitle { get; set; }
    public string? Company { get; set; }
    public string? Email { get; set; }
    public string? LinkedinUrl { get; set; }
    public string? TwitterHandle { get; set; }
    public string? Location { get; set; }
    public string Confidence { get; set; } = "low";
}

public class LeadScoreResult
{
    public int Score { get; set; }
    public string Summary { get; set; } = string.Empty;
}

public class GeneratedEmail
{
    public string Subject { get; set; } = string.Empty;
    public string BodyText { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;
}

public class GeneratedPost
{
    public string Copy { get; set; } = string.Empty;
    public List<string> Hashtags { get; set; } = [];
}

public class QuotaStatus
{
    public Guid UserId { get; set; }
    public string PlanName { get; set; } = "starter";
    public int LeadsUsed { get; set; }
    public int LeadsAllowed { get; set; }
    public int PostsUsed { get; set; }
    public int PostsAllowed { get; set; }
    public int BrandsUsed { get; set; }
    public int BrandsAllowed { get; set; }
    public bool LeadsExceeded => LeadsUsed >= LeadsAllowed;
    public bool PostsExceeded => PostsUsed >= PostsAllowed;
    public bool BrandsExceeded => BrandsUsed >= BrandsAllowed;
}

public enum EmailVerificationStatus
{
    Unverified,
    Verified,
    CatchAll,
    Invalid
}
