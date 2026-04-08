namespace Markopilot.Core.Models;

public class EnhanceOnboardingRequest
{
    public string Description { get; set; } = string.Empty;
}

public class EnhanceOnboardingResponse
{
    public string EnhancedDescription { get; set; } = string.Empty;
    public List<string> SuggestedJobTitles { get; set; } = [];
    public List<string> SuggestedPainPoints { get; set; } = [];
    public List<string> SuggestedGeographies { get; set; } = [];
    public List<string> SuggestedContentPillars { get; set; } = [];
}
