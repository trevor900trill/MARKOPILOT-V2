namespace Markopilot.Core.Models;

public class ModelPricing
{
    public string? Prompt { get; set; }
    public string? Completion { get; set; }
    public string? Request { get; set; }
    public string? Image { get; set; }
}

public class OpenRouterModelArchitecture
{
    public string? Modality { get; set; }
    public string? Tokenizer { get; set; }
    public string? InstructType { get; set; }
}

public class OpenRouterModelTopProvider
{
    public int? ContextLength { get; set; }
    public int? MaxCompletionTokens { get; set; }
    public bool? IsModerated { get; set; }
}

public class OpenRouterModelItem
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long? Created { get; set; }
    public string? Description { get; set; }
    public int? ContextLength { get; set; }
    public OpenRouterModelArchitecture? Architecture { get; set; }
    public ModelPricing? Pricing { get; set; }
    public OpenRouterModelTopProvider? TopProvider { get; set; }
    public bool? PerRequestLimits { get; set; }

    public bool IsExpired(DateTimeOffset now)
    {
        // If the model ID or name contains deprecated keywords
        if (Id.Contains(":deprecated", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }
        return false;
    }
}

public class OpenRouterModelsResponse
{
    public List<OpenRouterModelItem> Data { get; set; } = [];
}
