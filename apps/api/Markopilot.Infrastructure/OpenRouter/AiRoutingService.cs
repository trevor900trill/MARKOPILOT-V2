using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.OpenRouter;

public class AiRoutingService : IAiRoutingService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<AiRoutingService> _logger;

    public AiRoutingService(HttpClient httpClient, IConfiguration configuration, ILogger<AiRoutingService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
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
        return task switch
        {
            AiTask.LeadQueryGeneration => "groq/llama-3.3-70b-versatile",
            AiTask.EntityExtraction => "groq/llama-3.1-8b-instant",
            AiTask.LeadScoring => "groq/llama-3.1-8b-instant",
            AiTask.SocialPostGeneration => "google/gemini-2.0-flash-001",
            AiTask.EmailOutreachCopy => "google/gemini-2.5-flash",
            AiTask.ContentPillarSuggestion => "groq/llama-3.3-70b-versatile",
            _ => "google/gemini-2.5-flash"
        };
    }

    public async Task<AiCompletionResponse> CompleteAsync(AiCompletionRequest request)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            throw new InvalidOperationException("OpenRouter API key is missing. Cannot complete AI request.");
        }

        var model = GetModelForTask(request.Task);
        
        var payload = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = request.SystemPrompt },
                new { role = "user", content = request.UserPrompt }
            },
            temperature = request.Temperature,
            max_tokens = request.MaxTokens
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync("chat/completions", content);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("OpenRouter API Error: {Error}", err);
            throw new Exception($"Failed to complete AI request. Status: {response.StatusCode}, Detailed: {err}");
        }

        var resObj = await response.Content.ReadFromJsonAsync<JsonElement>();
        var choice = resObj.GetProperty("choices")[0];
        var responseContent = choice.GetProperty("message").GetProperty("content").GetString();
        
        var usage = resObj.GetProperty("usage");
        var promptTokens = usage.TryGetProperty("prompt_tokens", out var p) ? p.GetInt32() : 0;
        var completionTokens = usage.TryGetProperty("completion_tokens", out var c) ? c.GetInt32() : 0;
        var responseModel = resObj.TryGetProperty("model", out var m) ? m.GetString() : model;

        return new AiCompletionResponse
        {
            Content = responseContent ?? string.Empty,
            Model = responseModel ?? model,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens
        };
    }
}
