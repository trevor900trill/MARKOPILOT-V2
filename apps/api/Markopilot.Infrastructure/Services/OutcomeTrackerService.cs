using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class OutcomeTrackerService : IOutcomeTrackerService
{
    private readonly IAgentRepository _agentRepo;
    private readonly ILogger<OutcomeTrackerService> _logger;

    public OutcomeTrackerService(IAgentRepository agentRepo, ILogger<OutcomeTrackerService> logger)
    {
        _agentRepo = agentRepo;
        _logger = logger;
    }

    public async Task TrackActionOutcomeAsync(Guid actionId, Guid brandId, string metricType, double value, string metadataJson = "{}")
    {
        try
        {
            var outcome = new AgentOutcome
            {
                ActionId = actionId,
                BrandId = brandId,
                MetricType = metricType,
                MetricValue = value,
                MetadataJson = metadataJson,
                MeasuredAt = DateTimeOffset.UtcNow
            };

            await _agentRepo.SaveOutcomeAsync(outcome);
            _logger.LogInformation("Tracked outcome {MetricType}={Value} for action {ActionId}", metricType, value, actionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track outcome for action {ActionId}", actionId);
        }
    }

    public async Task<List<AgentOutcome>> GetBrandOutcomesAsync(Guid brandId, int limit = 50)
    {
        return await _agentRepo.GetOutcomesByBrandAsync(brandId, limit);
    }
}
