using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.AI;

public class ContentGenerationService : IContentGenerationService
{
    private readonly IAiRoutingService _aiService;
    private readonly ILogger<ContentGenerationService> _logger;
    private readonly string _promptsDir;

    public ContentGenerationService(IAiRoutingService aiService, ILogger<ContentGenerationService> logger)
    {
        _aiService = aiService;
        _logger = logger;
        
        // Find the ai-prompts directory
        var currentDir = AppDomain.CurrentDomain.BaseDirectory;
        var possiblePaths = new[]
        {
            Path.Combine(currentDir, "ai-prompts"), // Production (bundled with app)
            Path.Combine(currentDir, "packages", "ai-prompts"),
            Path.Combine(currentDir, "..", "..", "packages", "ai-prompts"),
            Path.Combine(currentDir, "..", "..", "..", "packages", "ai-prompts"),
            Path.Combine(currentDir, "..", "..", "..", "..", "packages", "ai-prompts")
        };
        
        _promptsDir = possiblePaths.FirstOrDefault(Directory.Exists) 
                      ?? Path.Combine(currentDir, "../../../../packages/ai-prompts");
    }

    private async Task<string> ReadPromptAsync(string filename)
    {
        var path = Path.Combine(_promptsDir, filename);
        if (!File.Exists(path))
        {
            _logger.LogError("Prompt template not found: {Path}", path);
            throw new FileNotFoundException($"Prompt template not found: {path}");
        }
        return await File.ReadAllTextAsync(path);
    }

    public async Task<GeneratedPost> GeneratePostAsync(Brand brand, string contentPillar, SocialPlatform platform)
    {
        var template = await ReadPromptAsync("social-post.txt");
        var systemContent = template
            .Replace("{{brandName}}", brand.Name)
            .Replace("{{industry}}", brand.Industry)
            .Replace("{{targetAudience}}", brand.TargetAudienceDescription ?? "")
            .Replace("{{brandVoice}}", $"{brand.BrandVoiceFormality}, {brand.BrandVoiceHumour}, {brand.BrandVoiceAssertiveness}, {brand.BrandVoiceEmpathy}");

        var request = new AiCompletionRequest
        {
            Task = AiTask.SocialPostGeneration,
            SystemPrompt = systemContent,
            UserPrompt = $"Generate a {platform} post about: {contentPillar}",
            MaxTokens = 1000
        };

        var response = await _aiService.CompleteAsync(request);
        
        try
        {
            var cleaned = CleanJsonResponse(response.Content);
            return JsonSerializer.Deserialize<GeneratedPost>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse GeneratedPost JSON: {Content}", response.Content);
            return new GeneratedPost { Copy = response.Content, Hashtags = new List<string>() };
        }
    }

    private string CleanJsonResponse(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return content;

        // 1. Find the first '{' (for objects) or '[' (for arrays)
        var startIndex = content.IndexOfAny(['{', '[']);
        if (startIndex == -1) return content;

        // 2. Find the last '}' or ']'
        var lastBrace = content.LastIndexOf('}');
        var lastBracket = content.LastIndexOf(']');
        var endIndex = Math.Max(lastBrace, lastBracket);

        if (endIndex == -1 || endIndex <= startIndex) return content;

        // 3. Extract just the JSON portion
        return content.Substring(startIndex, endIndex - startIndex + 1).Trim();
    }

    public async Task<GeneratedEmail> GenerateOutreachEmailAsync(Brand brand, Lead lead)
    {
        var template = await ReadPromptAsync("outreach-email.txt");
        var systemContent = template
            .Replace("{{brandName}}", brand.Name)
            .Replace("{{industry}}", brand.Industry)
            .Replace("{{targetAudience}}", brand.TargetAudienceDescription ?? "");

        var request = new AiCompletionRequest
        {
            Task = AiTask.EmailOutreachCopy,
            SystemPrompt = systemContent,
            UserPrompt = $"Lead name: {lead.Name}\nJob title: {lead.JobTitle}\nCompany: {lead.Company}\nBackground: {lead.AiSummary}",
            MaxTokens = 1500
        };

        var response = await _aiService.CompleteAsync(request);
        
        try
        {
            var cleaned = CleanJsonResponse(response.Content);
            return JsonSerializer.Deserialize<GeneratedEmail>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse GeneratedEmail JSON: {Content}", response.Content);
            return new GeneratedEmail { Subject = "Outreach", BodyText = response.Content, BodyHtml = $"<p>{response.Content.Replace("\n", "<br>")}</p>" };
        }
    }

    public async Task<GeneratedEmail> GenerateFollowUpEmailAsync(Brand brand, Lead lead, string originalSubject)
    {
        var template = await ReadPromptAsync("follow-up-email.txt");
        var systemContent = template
            .Replace("{{brandName}}", brand.Name)
            .Replace("{{industry}}", brand.Industry);

        var request = new AiCompletionRequest
        {
            Task = AiTask.EmailOutreachCopy,
            SystemPrompt = systemContent,
            UserPrompt = $"Lead name: {lead.Name}\nCompany: {lead.Company}\nOriginal subject: {originalSubject}",
            MaxTokens = 1000
        };

        var response = await _aiService.CompleteAsync(request);
        
        try
        {
            var cleaned = CleanJsonResponse(response.Content);
            return JsonSerializer.Deserialize<GeneratedEmail>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse GeneratedEmail JSON for Follow Up: {Content}", response.Content);
            return new GeneratedEmail { Subject = $"Re: {originalSubject}", BodyText = response.Content, BodyHtml = $"<p>{response.Content.Replace("\n", "<br>")}</p>" };
        }
    }

    public async Task<List<string>> SuggestContentPillarsAsync(Brand brand)
    {
        var template = await ReadPromptAsync("content-pillars.txt");
        var systemContent = template
            .Replace("{{brandName}}", brand.Name)
            .Replace("{{industry}}", brand.Industry)
            .Replace("{{targetAudience}}", brand.TargetAudienceDescription ?? "");

        var request = new AiCompletionRequest
        {
            Task = AiTask.ContentPillarSuggestion,
            SystemPrompt = systemContent,
            UserPrompt = "Please suggest 5 content pillars for this brand.",
            MaxTokens = 800
        };

        var response = await _aiService.CompleteAsync(request);
        
        try
        {
            var cleaned = CleanJsonResponse(response.Content);
            return JsonSerializer.Deserialize<List<string>>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse List<string> JSON: {Content}", response.Content);
            return new List<string> { response.Content };
        }
    }

    public async Task<List<string>> GenerateSearchQueriesAsync(Brand brand)
    {
        var template = await ReadPromptAsync("lead-queries.txt");
        var systemContent = template
            .Replace("{{brandName}}", brand.Name)
            .Replace("{{industry}}", brand.Industry)
            .Replace("{{targetAudience}}", brand.TargetAudienceDescription ?? "");

        var request = new AiCompletionRequest
        {
            Task = AiTask.LeadQueryGeneration,
            SystemPrompt = systemContent,
            UserPrompt = "Please generate 5 search queries to find leads.",
            MaxTokens = 600
        };

        var response = await _aiService.CompleteAsync(request);
        
        try
        {
            var res = JsonSerializer.Deserialize<List<string>>(response.Content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return res ?? new List<string>();
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse List<string> JSON for Search Queries: {Content}", response.Content);
            return new List<string> { response.Content };
        }
    }

    public async Task<EnhanceOnboardingResponse> EnhanceOnboardingAsync(string description)
    {
        var template = await ReadPromptAsync("onboarding-enhancement.txt");
        
        var request = new AiCompletionRequest
        {
            Task = AiTask.OnboardingEnhancement,
            SystemPrompt = template,
            UserPrompt = $"Raw description: {description}",
            MaxTokens = 2000
        };

        var response = await _aiService.CompleteAsync(request);
        
        try
        {
            var cleaned = CleanJsonResponse(response.Content);
            return JsonSerializer.Deserialize<EnhanceOnboardingResponse>(cleaned, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) 
                   ?? new EnhanceOnboardingResponse { EnhancedDescription = description };
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse EnhanceOnboardingResponse JSON: {Content}", response.Content);
            return new EnhanceOnboardingResponse { EnhancedDescription = description };
        }
    }
}
