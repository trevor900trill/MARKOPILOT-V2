using Markopilot.Api.Middleware;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/brands/{brandId:guid}/agent")]
public class AgentController : ControllerBase
{
    private readonly IAgentRepository _agentRepo;
    private readonly ISignalCollectorService _collectorService;
    private readonly ISignalProcessorService _processorService;
    private readonly IOpportunityEngineService _opportunityEngine;
    private readonly IActionDispatcherService _dispatcherService;
    private readonly IBrandRepository _brandRepo;
    private readonly ILogger<AgentController> _logger;

    public AgentController(
        IAgentRepository agentRepo,
        ISignalCollectorService collectorService,
        ISignalProcessorService processorService,
        IOpportunityEngineService opportunityEngine,
        IActionDispatcherService dispatcherService,
        IBrandRepository brandRepo,
        ILogger<AgentController> logger)
    {
        _agentRepo = agentRepo;
        _collectorService = collectorService;
        _processorService = processorService;
        _opportunityEngine = opportunityEngine;
        _dispatcherService = dispatcherService;
        _brandRepo = brandRepo;
        _logger = logger;
    }

    private Guid GetUserId() => HttpContext.GetUserId();

    private async Task<Brand?> GetAuthorizedBrandAsync(Guid brandId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return null;
        return await _brandRepo.GetBrandByIdAsync(brandId, userId);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardMetrics(Guid brandId)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        var metrics = await _agentRepo.GetAgentDashboardMetricsAsync(brandId);
        return Ok(metrics);
    }

    [HttpGet("signals")]
    public async Task<IActionResult> GetSignals(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        var (items, total) = await _agentRepo.GetSignalsPagedAsync(brandId, page, pageSize);
        var totalPages = (int)Math.Ceiling((double)total / Math.Max(1, pageSize));

        return Ok(new
        {
            items,
            total,
            page,
            pageSize,
            totalPages
        });
    }

    [HttpGet("opportunities")]
    public async Task<IActionResult> GetOpportunities(Guid brandId, [FromQuery] int limit = 50)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        var opps = await _agentRepo.GetOpportunitiesAsync(brandId, limit);
        return Ok(opps);
    }

    [HttpGet("actions")]
    public async Task<IActionResult> GetActions(Guid brandId, [FromQuery] int limit = 50)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        var actions = await _agentRepo.GetRecentActionsAsync(brandId, limit);
        return Ok(actions);
    }

    [HttpPost("actions/{actionId:guid}/approve")]
    public async Task<IActionResult> ApproveAction(Guid brandId, Guid actionId)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        var action = await _agentRepo.GetActionByIdAsync(actionId);
        if (action == null || action.BrandId != brandId) return NotFound("Action not found.");

        var success = await _dispatcherService.ApproveActionAsync(actionId);
        return Ok(new { success, message = success ? "Action approved and dispatched." : "Action approval failed." });
    }

    [HttpPost("actions/{actionId:guid}/reject")]
    public async Task<IActionResult> RejectAction(Guid brandId, Guid actionId, [FromBody] RejectActionRequest? req)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        var action = await _agentRepo.GetActionByIdAsync(actionId);
        if (action == null || action.BrandId != brandId) return NotFound("Action not found.");

        var success = await _dispatcherService.RejectActionAsync(actionId, req?.Reason ?? string.Empty);
        return Ok(new { success, message = "Action rejected." });
    }

    [HttpPost("trigger-cycle")]
    public async Task<IActionResult> TriggerCycle(Guid brandId)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        _logger.LogInformation("Manual Agent cycle triggered for brand {BrandName} ({BrandId})", brand.Name, brand.Id);

        var rawSignals = await _collectorService.CollectSignalsAsync(brand);
        var processed = await _processorService.ProcessSignalsAsync(brand, rawSignals);
        var opportunities = await _opportunityEngine.EvaluateOpportunitiesAsync(brand, processed);
        var actions = await _opportunityEngine.PlanActionsAsync(brand, opportunities);
        await _dispatcherService.ProcessPendingActionsAsync();

        return Ok(new
        {
            success = true,
            signalsCollected = rawSignals.Count,
            signalsProcessed = processed.Count,
            opportunitiesEvaluated = opportunities.Count,
            actionsPlanned = actions.Count
        });
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateAgentConfig(Guid brandId, [FromBody] UpdateAgentConfigRequest req)
    {
        var brand = await GetAuthorizedBrandAsync(brandId);
        if (brand == null) return NotFound("Brand not found or access denied.");

        if (req.GrowthGoal != null) brand.GrowthGoal = req.GrowthGoal;
        if (req.TargetMarketContext != null) brand.TargetMarketContext = req.TargetMarketContext;
        if (req.CompetitorUrls != null) brand.CompetitorUrls = req.CompetitorUrls;
        if (req.WatchKeywords != null) brand.WatchKeywords = req.WatchKeywords;
        if (req.WatchHashtags != null) brand.WatchHashtags = req.WatchHashtags;
        if (req.AgentAutonomyLevel.HasValue)
        {
            brand.AgentAutonomyLevel = req.AgentAutonomyLevel.Value;

            // Sync legacy boolean fields from the centralized autonomy level
            // so existing workers (SocialPostingWorker, OutreachWorker) behave correctly.
            switch (req.AgentAutonomyLevel.Value)
            {
                case AgentAutonomyLevel.ApproveAll:
                    brand.AutomationPostReviewEnabled = true;
                    brand.RequireEmailApproval = true;
                    break;
                case AgentAutonomyLevel.ApproveOutreach:
                    brand.AutomationPostReviewEnabled = false;
                    brand.RequireEmailApproval = true;
                    break;
                case AgentAutonomyLevel.FullAuto:
                    brand.AutomationPostReviewEnabled = false;
                    brand.RequireEmailApproval = false;
                    break;
            }
        }
        if (req.AgentEnabled.HasValue) brand.AgentEnabled = req.AgentEnabled.Value;

        var updated = await _brandRepo.UpdateBrandAsync(brand);
        return Ok(updated);
    }
}

public class RejectActionRequest
{
    public string? Reason { get; set; }
}

public class UpdateAgentConfigRequest
{
    public string? GrowthGoal { get; set; }
    public string? TargetMarketContext { get; set; }
    public List<string>? CompetitorUrls { get; set; }
    public List<string>? WatchKeywords { get; set; }
    public List<string>? WatchHashtags { get; set; }
    public AgentAutonomyLevel? AgentAutonomyLevel { get; set; }
    public bool? AgentEnabled { get; set; }
}
