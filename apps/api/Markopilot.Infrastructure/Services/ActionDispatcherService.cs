using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class ActionDispatcherService : IActionDispatcherService
{
    private readonly IEnumerable<IActionExecutor> _executors;
    private readonly IAgentRepository _agentRepo;
    private readonly ILogger<ActionDispatcherService> _logger;

    public ActionDispatcherService(
        IEnumerable<IActionExecutor> executors,
        IAgentRepository agentRepo,
        ILogger<ActionDispatcherService> logger)
    {
        _executors = executors;
        _agentRepo = agentRepo;
        _logger = logger;
    }

    public async Task ProcessPendingActionsAsync(CancellationToken ct = default)
    {
        var pendingActions = await _agentRepo.GetPendingActionsAsync(null, 25);
        if (pendingActions.Count == 0) return;

        _logger.LogInformation("ActionDispatcher processing {Count} executable actions...", pendingActions.Count);

        foreach (var action in pendingActions)
        {
            try
            {
                await ExecuteActionAsync(action, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing action {ActionId}", action.Id);
                await _agentRepo.UpdateActionStatusAsync(action.Id, ActionQueueStatus.Failed,
                    JsonSerializer.Serialize(new { error = ex.Message }));
            }
        }
    }

    public async Task<AgentActionResult> ExecuteActionAsync(ActionQueueItem action, CancellationToken ct = default)
    {
        await _agentRepo.UpdateActionStatusAsync(action.Id, ActionQueueStatus.Executing);

        // Find appropriate executor
        var executor = _executors.FirstOrDefault(e => e.ActionType == action.ActionType);

        if (executor == null)
        {
            var msg = $"No executor found for action type {action.ActionType}";
            await _agentRepo.UpdateActionStatusAsync(action.Id, ActionQueueStatus.Failed,
                JsonSerializer.Serialize(new { error = msg }));
            return new AgentActionResult { Success = false, Message = msg };
        }

        var result = await executor.ExecuteAsync(action, ct);
        var status = result.Success ? ActionQueueStatus.Completed : ActionQueueStatus.Failed;
        var resultJson = JsonSerializer.Serialize(result);

        await _agentRepo.UpdateActionStatusAsync(action.Id, status, resultJson);

        return result;
    }

    public async Task<bool> ApproveActionAsync(Guid actionId, CancellationToken ct = default)
    {
        var action = await _agentRepo.GetActionByIdAsync(actionId);
        if (action == null) return false;

        await _agentRepo.UpdateActionStatusAsync(actionId, ActionQueueStatus.Approved);
        // Execute immediately upon approval
        action.Status = ActionQueueStatus.Approved;
        var result = await ExecuteActionAsync(action, ct);
        return result.Success;
    }

    public async Task<bool> RejectActionAsync(Guid actionId, string reason = "", CancellationToken ct = default)
    {
        var action = await _agentRepo.GetActionByIdAsync(actionId);
        if (action == null) return false;

        await _agentRepo.UpdateActionStatusAsync(actionId, ActionQueueStatus.Rejected,
            JsonSerializer.Serialize(new { rejectedReason = reason }));
        return true;
    }
}
