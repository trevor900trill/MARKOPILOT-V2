using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class OpportunityEngineService : IOpportunityEngineService
{
    private readonly IAiRoutingService _aiRouting;
    private readonly IAgentRepository _agentRepo;
    private readonly ILogger<OpportunityEngineService> _logger;

    public OpportunityEngineService(
        IAiRoutingService aiRouting,
        IAgentRepository agentRepo,
        ILogger<OpportunityEngineService> logger)
    {
        _aiRouting = aiRouting;
        _agentRepo = agentRepo;
        _logger = logger;
    }

    public async Task<List<Opportunity>> EvaluateOpportunitiesAsync(
        Brand brand,
        List<ProcessedSignal> signals,
        CancellationToken ct = default)
    {
        var opportunities = new List<Opportunity>();
        // Only evaluate signals that have meaningful potential (score >= 45 or high urgency)
        var viableSignals = signals
            .Where(s => s.RelevanceScore >= 45 || s.Urgency == SignalUrgency.ActNow || s.Urgency == SignalUrgency.ActToday)
            .Take(10)
            .ToList();

        if (viableSignals.Count == 0)
        {
            _logger.LogInformation("No signals met the opportunity evaluation threshold for brand {BrandName}", brand.Name);
            return opportunities;
        }

        _logger.LogInformation("Evaluating opportunities from {Count} viable signals for brand {BrandName}...",
            viableSignals.Count, brand.Name);

        var systemPrompt = $@"You are the Chief Growth Strategist for '{brand.Name}'.
Growth Goal: ""{(string.IsNullOrWhiteSpace(brand.GrowthGoal) ? "Grow market presence and customer acquisition" : brand.GrowthGoal)}""
Industry: {brand.Industry}
Brand Voice: {brand.BrandVoiceFormality}, {brand.BrandVoiceAssertiveness}

Review these processed signals and decide which ones represent concrete commercial opportunities worth pursuing.
Return a JSON object with an 'opportunities' array:
{{
  ""opportunities"": [
    {{
      ""signalIndex"": 0,
      ""title"": ""concise action-oriented opportunity title (e.g. 'Engage Creator Struggling with Scheduling')"",
      ""reasoning"": ""why this opportunity directly advances the brand's growth goal"",
      ""category"": ""CreatorOpportunity"" | ""CompetitorMove"" | ""MarketTrend"" | ""BrandMention"" | ""IndustryEvent"" | ""PartnershipLead"" | ""ContentInspiration"" | ""ThreatAlert"",
      ""relevanceScore"": 0 to 100,
      ""urgency"": ""ActNow"" | ""ActToday"" | ""ActThisWeek"" | ""Monitor""
    }}
  ]
}}";

        var signalsPayload = viableSignals.Select((s, index) => new
        {
            signalIndex = index,
            title = s.Signal.Title,
            category = s.Category.ToString(),
            intent = s.Intent,
            urgency = s.Urgency.ToString(),
            relevanceScore = s.RelevanceScore,
            snippet = s.Signal.Content.Length > 300 ? s.Signal.Content[..300] : s.Signal.Content
        });

        try
        {
            var response = await _aiRouting.CompleteAsync(new AiCompletionRequest
            {
                Task = AiTask.OpportunityEvaluation,
                SystemPrompt = systemPrompt,
                UserPrompt = "Evaluate these signals for growth opportunities:\n" + JsonSerializer.Serialize(signalsPayload),
                Temperature = 0.3,
                MaxTokens = 2048,
                RequireJson = true
            });

            var parsed = ParseAiOpportunities(response.Content);

            foreach (var item in parsed)
            {
                if (item.SignalIndex < 0 || item.SignalIndex >= viableSignals.Count) continue;
                var sig = viableSignals[item.SignalIndex];

                Enum.TryParse<SignalCategory>(item.Category, true, out var cat);
                Enum.TryParse<SignalUrgency>(item.Urgency, true, out var urg);

                var opp = new Opportunity
                {
                    BrandId = brand.Id,
                    SignalId = sig.Signal.Id,
                    Category = cat,
                    Title = item.Title ?? sig.Signal.Title,
                    Reasoning = item.Reasoning ?? sig.Reasoning,
                    RelevanceScore = item.RelevanceScore > 0 ? item.RelevanceScore : sig.RelevanceScore,
                    Urgency = urg,
                    Status = OpportunityStatus.Pending,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                await _agentRepo.SaveOpportunityAsync(opp);
                opportunities.Add(opp);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to evaluate opportunities for brand {BrandName}", brand.Name);
        }

        return opportunities;
    }

    public async Task<List<Opportunity>> EvaluateLeadOpportunitiesAsync(
        Brand brand,
        List<Lead> leads,
        CancellationToken ct = default)
    {
        // Lead discovery has already performed extraction and scoring. Promote qualified
        // leads directly into the same opportunity queue rather than treating them as an
        // unrelated output of a separate pipeline.
        var opportunities = new List<Opportunity>();
        foreach (var lead in leads.Where(l => l.LeadScore >= 60))
        {
            var subject = !string.IsNullOrWhiteSpace(lead.Company)
                ? lead.Company
                : lead.Name ?? "qualified prospect";
            var opp = new Opportunity
            {
                BrandId = brand.Id,
                LeadId = lead.Id,
                Category = SignalCategory.PartnershipLead,
                Title = $"Qualify and engage {subject}",
                Reasoning = string.IsNullOrWhiteSpace(lead.AiSummary)
                    ? $"{subject} matched the ideal customer profile with a lead score of {lead.LeadScore}."
                    : lead.AiSummary,
                RelevanceScore = lead.LeadScore,
                Urgency = lead.LeadScore >= 80 ? SignalUrgency.ActToday : SignalUrgency.ActThisWeek,
                Status = OpportunityStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _agentRepo.SaveOpportunityAsync(opp);
            opportunities.Add(opp);
        }

        return opportunities;
    }

    public async Task<List<ActionQueueItem>> PlanActionsAsync(
        Brand brand,
        List<Opportunity> opportunities,
        CancellationToken ct = default)
    {
        var actions = new List<ActionQueueItem>();
        if (opportunities.Count == 0) return actions;

        _logger.LogInformation("Planning actions for {Count} opportunities for brand {BrandName}...",
            opportunities.Count, brand.Name);

        var systemPrompt = $@"You are the autonomous growth engine planning concrete actions for '{brand.Name}'.
Growth Goal: ""{(string.IsNullOrWhiteSpace(brand.GrowthGoal) ? "Acquire customers and expand reach" : brand.GrowthGoal)}""
Brand Voice: {brand.BrandVoiceFormality}, {brand.BrandVoiceAssertiveness}, humour: {brand.BrandVoiceHumour}
Target Geographies: {string.Join(", ", brand.TargetGeographies ?? ["Global"])}
Autonomy Level: {brand.AgentAutonomyLevel}

For each opportunity, plan 1 to 2 high-impact actions.
Available executable ActionTypes:
- DraftReactivePost: writes a timely post for social media responding to a trend or competitor move
- DraftReplyToCreator: drafts a helpful, non-spam reply to a creator or user discussion
- NotifyHuman: sends a priority alert to the brand owner about a critical market change

Do not return an action that is not listed above. Lead opportunities should normally use NotifyHuman so a human can review the qualified prospect before outreach.

Return a JSON object:
{{
  ""actions"": [
    {{
      ""opportunityIndex"": 0,
      ""actionType"": ""DraftReactivePost"" | ""DraftReplyToCreator"" | ""NotifyHuman"",
      ""priority"": 1 to 5 (1 is highest),
      ""reasoning"": ""why this action will drive growth"",
      ""draftContent"": {{
         ""copy"": ""ready-to-publish or review copy"",
         ""headline"": ""subject or headline"",
         ""platform"": ""Twitter"" | ""LinkedIn"" | ""Email"",
         ""hashtags"": [""tag1"", ""tag2""]
      }},
      ""targetEntity"": {{
         ""name"": ""creator or company name if applicable"",
         ""url"": ""target link or profile"",
         ""handle"": ""@handle if applicable""
      }}
    }}
  ]
}}";

        var oppPayload = opportunities.Select((o, idx) => new
        {
            opportunityIndex = idx,
            category = o.Category.ToString(),
            title = o.Title,
            reasoning = o.Reasoning,
            urgency = o.Urgency.ToString(),
            relevanceScore = o.RelevanceScore
        });

        try
        {
            var response = await _aiRouting.CompleteAsync(new AiCompletionRequest
            {
                Task = AiTask.ActionPlanning,
                SystemPrompt = systemPrompt,
                UserPrompt = "Plan strategic growth actions for these opportunities:\n" + JsonSerializer.Serialize(oppPayload),
                Temperature = 0.4,
                MaxTokens = 2500,
                RequireJson = true
            });

            var parsedActions = ParseAiActions(response.Content);

            foreach (var pa in parsedActions)
            {
                if (pa.OpportunityIndex < 0 || pa.OpportunityIndex >= opportunities.Count) continue;
                var opp = opportunities[pa.OpportunityIndex];

                Enum.TryParse<ActionType>(pa.ActionType, true, out var actionType);

                // Determine approval requirement based on Autonomy Level and Action Type
                var approvalRequired = DetermineApprovalRequired(brand.AgentAutonomyLevel, actionType);

                var queueItem = new ActionQueueItem
                {
                    BrandId = brand.Id,
                    OpportunityId = opp.Id,
                    ActionType = actionType,
                    Priority = pa.Priority > 0 ? pa.Priority : 3,
                    Reasoning = pa.Reasoning ?? opp.Reasoning,
                    DraftContentJson = pa.DraftContent != null ? JsonSerializer.Serialize(pa.DraftContent) : "{}",
                    TargetEntityJson = pa.TargetEntity != null ? JsonSerializer.Serialize(pa.TargetEntity) : "{}",
                    ApprovalRequired = approvalRequired,
                    Status = ActionQueueStatus.Pending,
                    ScheduledFor = DateTimeOffset.UtcNow,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                actions.Add(queueItem);
                await _agentRepo.UpdateOpportunityStatusAsync(opp.Id, OpportunityStatus.Planned);
            }

            if (actions.Count > 0)
            {
                await _agentRepo.EnqueueActionsAsync(actions);
                _logger.LogInformation("Enqueued {Count} actions for brand {BrandName}", actions.Count, brand.Name);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to plan actions for brand {BrandName}", brand.Name);
        }

        return actions;
    }

    private static bool DetermineApprovalRequired(AgentAutonomyLevel level, ActionType actionType)
    {
        return level switch
        {
            AgentAutonomyLevel.ApproveAll => true,
            AgentAutonomyLevel.ApproveOutreach => actionType switch
            {
                ActionType.SendOutreachEmail => true,
                ActionType.IdentifyAndReachCreator => true,
                ActionType.DraftReplyToCreator => true,
                ActionType.CreateOutreachCampaign => true,
                ActionType.DraftReactivePost => false,
                ActionType.ScheduleContentSeries => false,
                ActionType.UpdateLeadScore => false,
                ActionType.AddToWatchlist => false,
                ActionType.NotifyHuman => false,
                _ => true
            },
            AgentAutonomyLevel.FullAuto => actionType switch
            {
                ActionType.SendOutreachEmail => true, // safety gate for unsolicited email
                _ => false
            },
            _ => true
        };
    }

    // ── DTOs ─────────────────────────────────────────

    private class AiOpportunityItem
    {
        public int SignalIndex { get; set; }
        public string? Title { get; set; }
        public string? Reasoning { get; set; }
        public string? Category { get; set; }
        public double RelevanceScore { get; set; }
        public string? Urgency { get; set; }
    }

    private class AiOpportunityContainer
    {
        public List<AiOpportunityItem>? Opportunities { get; set; }
    }

    private class AiActionItem
    {
        public int OpportunityIndex { get; set; }
        public string? ActionType { get; set; }
        public int Priority { get; set; }
        public string? Reasoning { get; set; }
        public JsonElement? DraftContent { get; set; }
        public JsonElement? TargetEntity { get; set; }
    }

    private class AiActionContainer
    {
        public List<AiActionItem>? Actions { get; set; }
    }

    private List<AiOpportunityItem> ParseAiOpportunities(string json)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var container = JsonSerializer.Deserialize<AiOpportunityContainer>(json, options);
            if (container?.Opportunities != null) return container.Opportunities;

            var list = JsonSerializer.Deserialize<List<AiOpportunityItem>>(json, options);
            if (list != null) return list;
        }
        catch { }
        return [];
    }

    private List<AiActionItem> ParseAiActions(string json)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var container = JsonSerializer.Deserialize<AiActionContainer>(json, options);
            if (container?.Actions != null) return container.Actions;

            var list = JsonSerializer.Deserialize<List<AiActionItem>>(json, options);
            if (list != null) return list;
        }
        catch { }
        return [];
    }
}
