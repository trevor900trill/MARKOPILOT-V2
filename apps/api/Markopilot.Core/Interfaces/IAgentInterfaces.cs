using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

public interface ISignalCollector
{
    SignalSourceType SourceType { get; }
    Task<List<RawSignal>> CollectAsync(Brand brand, CancellationToken ct = default);
}

public interface ISignalCollectorService
{
    Task<List<RawSignal>> CollectSignalsAsync(Brand brand, CancellationToken ct = default);
}

public interface ISignalProcessorService
{
    Task<List<ProcessedSignal>> ProcessSignalsAsync(Brand brand, List<RawSignal> signals, CancellationToken ct = default);
}

public interface IOpportunityEngineService
{
    Task<List<Opportunity>> EvaluateOpportunitiesAsync(Brand brand, List<ProcessedSignal> signals, CancellationToken ct = default);
    Task<List<ActionQueueItem>> PlanActionsAsync(Brand brand, List<Opportunity> opportunities, CancellationToken ct = default);
}

public interface IActionExecutor
{
    ActionType ActionType { get; }
    Task<AgentActionResult> ExecuteAsync(ActionQueueItem action, CancellationToken ct = default);
}

public interface IActionDispatcherService
{
    Task ProcessPendingActionsAsync(CancellationToken ct = default);
    Task<AgentActionResult> ExecuteActionAsync(ActionQueueItem action, CancellationToken ct = default);
    Task<bool> ApproveActionAsync(Guid actionId, CancellationToken ct = default);
    Task<bool> RejectActionAsync(Guid actionId, string reason = "", CancellationToken ct = default);
}

public interface IOutcomeTrackerService
{
    Task TrackActionOutcomeAsync(Guid actionId, Guid brandId, string metricType, double value, string metadataJson = "{}");
    Task<List<AgentOutcome>> GetBrandOutcomesAsync(Guid brandId, int limit = 50);
}

public interface IAgentRepository
{
    // Signals
    Task SaveSignalsAsync(List<RawSignal> signals);
    Task<List<RawSignal>> GetUnprocessedSignalsAsync(Guid brandId, int limit = 50);
    Task MarkSignalProcessedAsync(Guid signalId, double? relevanceScore = null);

    // Opportunities
    Task SaveOpportunityAsync(Opportunity opportunity);
    Task<List<Opportunity>> GetOpportunitiesAsync(Guid brandId, int limit = 50);
    Task UpdateOpportunityStatusAsync(Guid opportunityId, OpportunityStatus status);

    // Actions
    Task EnqueueActionsAsync(List<ActionQueueItem> actions);
    Task<List<ActionQueueItem>> GetPendingActionsAsync(Guid? brandId = null, int limit = 50);
    Task<ActionQueueItem?> GetActionByIdAsync(Guid actionId);
    Task UpdateActionStatusAsync(Guid actionId, ActionQueueStatus status, string? resultJson = null);
    Task<List<ActionQueueItem>> GetRecentActionsAsync(Guid brandId, int limit = 50);

    // Outcomes
    Task SaveOutcomeAsync(AgentOutcome outcome);
    Task<List<AgentOutcome>> GetOutcomesByBrandAsync(Guid brandId, int limit = 50);

    // Dashboard
    Task<AgentDashboardMetrics> GetAgentDashboardMetricsAsync(Guid brandId);
}
