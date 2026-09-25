using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.OpenRouter;

public record TaskRoutingConfig(
    string CostTier,
    string PrimaryModel,
    string FallbackModel,
    string[]? AllowedModels = null
);

public class AiRoutingService : IAiRoutingService
{
    private readonly HttpClient _httpClient;
    private readonly IModelRegistryService? _modelRegistry;
    private readonly string? _apiKey;
    private readonly ILogger<AiRoutingService> _logger;

    private static readonly Dictionary<AiTask, TaskRoutingConfig> _routingConfig = new()
    {
        // Tier 4: LOW / LIGHTWEIGHT — cheap, fast, bulk ops
        [AiTask.EntityExtraction] = new(
            CostTier: "low",
            PrimaryModel: "meta-llama/llama-3.1-8b-instruct",
            FallbackModel: "google/gemma-3-4b-it",
            AllowedModels: ["meta-llama/*", "google/gemma-*"]
        ),

        // Tier 3: EXTRACTION / MID — structured output, instruction following
        [AiTask.LeadQueryGeneration] = new(
            CostTier: "medium",
            PrimaryModel: "meta-llama/llama-3.3-70b-instruct",
            FallbackModel: "google/gemini-2.5-flash",
            AllowedModels: ["meta-llama/*", "google/gemini-*"]
        ),
        [AiTask.ContentPillarSuggestion] = new(
            CostTier: "medium",
            PrimaryModel: "meta-llama/llama-3.3-70b-instruct",
            FallbackModel: "google/gemini-2.5-flash"
        ),
        [AiTask.SignalClassification] = new(
            CostTier: "medium",
            PrimaryModel: "google/gemini-2.5-flash",
            FallbackModel: "meta-llama/llama-3.3-70b-instruct",
            AllowedModels: ["google/gemini-*", "meta-llama/*"]
        ),
        [AiTask.OnboardingEnhancement] = new(
            CostTier: "medium",
            PrimaryModel: "google/gemini-2.5-flash",
            FallbackModel: "meta-llama/llama-3.3-70b-instruct"
        ),

        // Tier 2: GENERATION — creative writing, natural tone
        [AiTask.SocialPostGeneration] = new(
            CostTier: "medium",
            PrimaryModel: "google/gemini-2.5-flash",
            FallbackModel: "anthropic/claude-sonnet-4",
            AllowedModels: ["google/gemini-*", "anthropic/*"]
        ),
        [AiTask.ImagePromptGeneration] = new(
            CostTier: "medium",
            PrimaryModel: "google/gemini-2.5-flash",
            FallbackModel: "meta-llama/llama-3.3-70b-instruct"
        ),
        [AiTask.ReplyDrafting] = new(
            CostTier: "high",
            PrimaryModel: "anthropic/claude-sonnet-4",
            FallbackModel: "google/gemini-2.5-flash",
            AllowedModels: ["anthropic/*", "google/gemini-*"]
        ),
        [AiTask.WeeklyReportGeneration] = new(
            CostTier: "medium",
            PrimaryModel: "google/gemini-2.5-flash",
            FallbackModel: "meta-llama/llama-3.3-70b-instruct"
        ),

        // Tier 1: REASONING — business judgment, heavy thinking
        [AiTask.LeadScoring] = new(
            CostTier: "high",
            PrimaryModel: "google/gemini-2.5-pro",
            FallbackModel: "anthropic/claude-sonnet-4",
            AllowedModels: ["google/gemini-2.5-pro", "anthropic/*"]
        ),
        [AiTask.EmailOutreachCopy] = new(
            CostTier: "high",
            PrimaryModel: "anthropic/claude-sonnet-4",
            FallbackModel: "google/gemini-2.5-pro",
            AllowedModels: ["anthropic/*", "google/gemini-*"]
        ),
        [AiTask.OpportunityEvaluation] = new(
            CostTier: "high",
            PrimaryModel: "google/gemini-2.5-pro",
            FallbackModel: "anthropic/claude-sonnet-4",
            AllowedModels: ["google/gemini-2.5-pro", "anthropic/*"]
        ),
        [AiTask.ActionPlanning] = new(
            CostTier: "max",
            PrimaryModel: "anthropic/claude-sonnet-4",
            FallbackModel: "google/gemini-2.5-pro",
            AllowedModels: ["anthropic/claude-sonnet-4", "google/gemini-2.5-pro", "openai/gpt-4o"]
        )
    };

    public AiRoutingService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<AiRoutingService> logger,
        IModelRegistryService? modelRegistry = null)
    {
        _httpClient = httpClient;
        _logger = logger;
        _modelRegistry = modelRegistry;
        _apiKey = configuration["OpenRouter:ApiKey"];

        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("OpenRouter:ApiKey is not configured.");
        }

        _httpClient.BaseAddress = new Uri("https://openrouter.ai/api/v1/");
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }
    }

    public string GetModelForTask(AiTask task)
    {
        return _routingConfig.TryGetValue(task, out var config)
            ? config.PrimaryModel
            : "google/gemini-2.5-flash";
    }

    public string GetFallbackModelForTask(AiTask task)
    {
        return _routingConfig.TryGetValue(task, out var config)
            ? config.FallbackModel
            : "google/gemini-2.5-flash";
    }

    /// <summary>
    /// Uses TypeSafe's Jev decision model on OpenRouter (typesafe/jev-latest)
    /// to dynamically pick the best model for a task based on prompt complexity and choices.
    /// </summary>
    public async Task<string> DecideModelWithJevAsync(AiTask task, string promptSnippet, string[] candidateModels)
    {
        if (candidateModels == null || candidateModels.Length == 0)
        {
            return GetModelForTask(task);
        }

        if (candidateModels.Length == 1)
        {
            return candidateModels[0];
        }

        if (string.IsNullOrEmpty(_apiKey))
        {
            return GetModelForTask(task);
        }

        try
        {
            var snippet = promptSnippet.Length > 200 ? promptSnippet[..200] + "..." : promptSnippet;
            var payload = new
            {
                model = "typesafe/jev-latest",
                messages = new object[]
                {
                    new
                    {
                        role = "user",
                        content = $"Select the single most suitable AI model from the candidates for this task ({task}):\nPrompt excerpt: {snippet}\nCandidate choices: {string.Join(", ", candidateModels)}\nRespond with ONLY the exact chosen model id from the candidates."
                    }
                },
                max_tokens = 50,
                temperature = 0.0
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("chat/completions", content);

            if (response.IsSuccessStatusCode)
            {
                var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
                var choice = resObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()?.Trim();

                if (!string.IsNullOrWhiteSpace(choice))
                {
                    var matched = candidateModels.FirstOrDefault(m =>
                        string.Equals(m, choice, StringComparison.OrdinalIgnoreCase) ||
                        choice.Contains(m, StringComparison.OrdinalIgnoreCase));

                    if (matched != null)
                    {
                        _logger.LogInformation("Jev (typesafe/jev-latest) selected model '{Model}' for task {Task}", matched, task);
                        return matched;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Jev dynamic routing evaluation failed for task {Task}; using default primary model.", task);
        }

        return GetModelForTask(task);
    }

    public async Task<AiCompletionResponse> CompleteAsync(AiCompletionRequest request)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            throw new InvalidOperationException("OpenRouter API key is missing. Cannot complete AI request.");
        }

        var config = _routingConfig.GetValueOrDefault(request.Task)
            ?? new TaskRoutingConfig("medium", "google/gemini-2.5-flash", "google/gemini-2.5-flash");

        string[]? activeAllowedModels = null;
        if (_modelRegistry != null && config.AllowedModels != null && config.AllowedModels.Length > 0)
        {
            try
            {
                activeAllowedModels = await _modelRegistry.FilterActiveModelsAsync(config.AllowedModels);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to filter active models from registry; falling back to static config.");
            }
        }

        // Try primary auto-routed request first
        try
        {
            return await ExecuteRequestAsync(request, config, activeAllowedModels, useFallback: false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Primary model routing failed for task {Task}. Attempting fallback model {FallbackModel}...",
                request.Task, config.FallbackModel);

            // Execute fallback directly on the fallback model
            return await ExecuteRequestAsync(request, config, activeAllowedModels, useFallback: true);
        }
    }

    private async Task<AiCompletionResponse> ExecuteRequestAsync(
        AiCompletionRequest request,
        TaskRoutingConfig config,
        string[]? activeAllowedModels,
        bool useFallback)
    {
        var targetModel = useFallback ? config.FallbackModel : "openrouter/auto";

        var payloadDict = new Dictionary<string, object>
        {
            ["model"] = targetModel,
            ["messages"] = new object[]
            {
                new { role = "system", content = request.SystemPrompt },
                new { role = "user", content = request.UserPrompt }
            },
            ["temperature"] = request.Temperature,
            ["max_tokens"] = request.MaxTokens
        };

        if (request.RequireJson)
        {
            payloadDict["response_format"] = new { type = "json_object" };
        }

        // Configure auto-router plugin if using openrouter/auto
        if (!useFallback)
        {
            var autoRouterPlugin = new Dictionary<string, object>
            {
                ["id"] = "auto-router",
                ["cost_tier"] = config.CostTier
            };

            if (activeAllowedModels != null && activeAllowedModels.Length > 0)
            {
                autoRouterPlugin["allowed_models"] = activeAllowedModels;
            }

            payloadDict["plugins"] = new[] { autoRouterPlugin };
            // Also provide models fallback chain to OpenRouter
            payloadDict["models"] = new[] { config.PrimaryModel, config.FallbackModel };
        }

        var content = new StringContent(JsonSerializer.Serialize(payloadDict), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("chat/completions", content);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("OpenRouter API Error: {Error}", err);
            throw new Exception($"OpenRouter completion failed. Status: {response.StatusCode}, Detailed: {err}");
        }

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        var choice = resObj.GetProperty("choices")[0];
        var responseContent = choice.GetProperty("message").GetProperty("content").GetString();

        var usage = resObj.GetProperty("usage");
        var promptTokens = usage.TryGetProperty("prompt_tokens", out var p) ? p.GetInt32() : 0;
        var completionTokens = usage.TryGetProperty("completion_tokens", out var c) ? c.GetInt32() : 0;
        var responseModel = resObj.TryGetProperty("model", out var m) ? m.GetString() : targetModel;

        _logger.LogInformation(
            "Task {Task} completed using {Model} (cost_tier: {Tier}, promptTokens: {Prompt}, completionTokens: {Comp})",
            request.Task, responseModel, config.CostTier, promptTokens, completionTokens);

        return new AiCompletionResponse
        {
            Content = responseContent ?? string.Empty,
            Model = responseModel ?? targetModel,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens
        };
    }
}
