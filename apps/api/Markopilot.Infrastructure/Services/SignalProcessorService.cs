using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class SignalProcessorService : ISignalProcessorService
{
    private readonly IAiRoutingService _aiRouting;
    private readonly IAgentRepository _agentRepo;
    private readonly ILogger<SignalProcessorService> _logger;

    public SignalProcessorService(
        IAiRoutingService aiRouting,
        IAgentRepository agentRepo,
        ILogger<SignalProcessorService> logger)
    {
        _aiRouting = aiRouting;
        _agentRepo = agentRepo;
        _logger = logger;
    }

    public async Task<List<ProcessedSignal>> ProcessSignalsAsync(
        Brand brand,
        List<RawSignal> signals,
        CancellationToken ct = default)
    {
        var processedList = new List<ProcessedSignal>();
        if (signals.Count == 0) return processedList;

        _logger.LogInformation("Processing {Count} signals for brand {BrandName}...", signals.Count, brand.Name);

        // Process in batches of 5 to optimize token usage and avoid output truncation
        var batches = signals.Chunk(5).ToList();

        foreach (var batch in batches)
        {
            var batchSignals = batch.ToList();
            try
            {
                var promptSignals = batchSignals.Select((s, index) => new
                {
                    index,
                    title = s.Title,
                    content = s.Content.Length > 400 ? s.Content[..400] + "..." : s.Content,
                    source = s.SourceName,
                    sourceType = s.SourceType.ToString(),
                    author = s.Author
                }).ToList();

                var systemPrompt = $@"You are an AI growth strategist evaluating signals for the brand '{brand.Name}'.
Industry: {brand.Industry}
Growth Goal: ""{(string.IsNullOrWhiteSpace(brand.GrowthGoal) ? "Accelerate brand reach and acquire new customers" : brand.GrowthGoal)}""
Target Market: {string.Join(", ", brand.TargetGeographies ?? ["General"])}
Pain Points: {string.Join(", ", brand.TargetPainPoints ?? ["marketing automation"])}
Watch Keywords: {string.Join(", ", brand.WatchKeywords ?? [])}

Analyze each signal and return a JSON object with a 'classifications' array:
{{
  ""classifications"": [
    {{
      ""index"": 0,
      ""category"": ""CreatorOpportunity"" | ""CompetitorMove"" | ""MarketTrend"" | ""BrandMention"" | ""IndustryEvent"" | ""PartnershipLead"" | ""ContentInspiration"" | ""ThreatAlert"" | ""CustomerConversation"" | ""FundingNews"",
      ""relevanceScore"": 0 to 100 (how directly actionable this is to the brand's growth goal),
      ""extractedEntities"": [""entity1"", ""entity2""],
      ""intent"": ""one sentence explaining what the author is expressing"",
      ""opportunityType"": ""brief descriptor of potential action"",
      ""urgency"": ""ActNow"" | ""ActToday"" | ""ActThisWeek"" | ""Monitor"",
      ""reasoning"": ""brief explanation of why this matters for the brand's growth goal""
    }}
  ]
}}";

                var userPrompt = $"Evaluate these {batchSignals.Count} signals:\n" + JsonSerializer.Serialize(promptSignals);

                var aiResponse = await _aiRouting.CompleteAsync(new AiCompletionRequest
                {
                    Task = AiTask.SignalClassification,
                    SystemPrompt = systemPrompt,
                    UserPrompt = userPrompt,
                    Temperature = 0.2,
                    MaxTokens = 2048,
                    RequireJson = true
                });

                var parsed = ParseAiClassifications(aiResponse.Content);

                for (int i = 0; i < batchSignals.Count; i++)
                {
                    var sig = batchSignals[i];
                    var classification = parsed.FirstOrDefault(c => c.Index == i) ?? new AiSignalClassificationItem
                    {
                        Category = "MarketTrend",
                        RelevanceScore = 50,
                        Intent = "General industry update",
                        OpportunityType = "ContentInspiration",
                        Urgency = "ActThisWeek",
                        Reasoning = "Relevant industry context"
                    };

                    Enum.TryParse<SignalCategory>(classification.Category, true, out var cat);
                    Enum.TryParse<SignalUrgency>(classification.Urgency, true, out var urg);

                    var proc = new ProcessedSignal
                    {
                        Signal = sig,
                        Category = cat,
                        RelevanceScore = classification.RelevanceScore,
                        ExtractedEntities = classification.ExtractedEntities ?? [],
                        Intent = classification.Intent ?? string.Empty,
                        OpportunityType = classification.OpportunityType ?? string.Empty,
                        Urgency = urg,
                        Reasoning = classification.Reasoning ?? string.Empty
                    };

                    await _agentRepo.MarkSignalProcessedAsync(sig.Id, proc.RelevanceScore);
                    processedList.Add(proc);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process signal batch for brand {BrandName}", brand.Name);
                // Mark as processed with default score so we don't infinitely retry
                foreach (var sig in batchSignals)
                {
                    await _agentRepo.MarkSignalProcessedAsync(sig.Id, 30);
                }
            }
        }

        return processedList;
    }

    private class AiSignalClassificationItem
    {
        public int Index { get; set; }
        public string? Category { get; set; }
        public double RelevanceScore { get; set; }
        public List<string>? ExtractedEntities { get; set; }
        public string? Intent { get; set; }
        public string? OpportunityType { get; set; }
        public string? Urgency { get; set; }
        public string? Reasoning { get; set; }
    }

    private class AiClassificationContainer
    {
        public List<AiSignalClassificationItem>? Classifications { get; set; }
    }

    private List<AiSignalClassificationItem> ParseAiClassifications(string json)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var container = JsonSerializer.Deserialize<AiClassificationContainer>(json, options);
            if (container?.Classifications != null && container.Classifications.Count > 0)
            {
                return container.Classifications;
            }

            // Direct list fallback
            var list = JsonSerializer.Deserialize<List<AiSignalClassificationItem>>(json, options);
            if (list != null) return list;
        }
        catch
        {
            // Regex fallback if needed
        }

        return [];
    }
}
