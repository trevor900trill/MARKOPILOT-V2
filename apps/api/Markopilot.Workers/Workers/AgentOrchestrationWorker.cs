using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

public class AgentOrchestrationWorker
{
    private readonly ISignalCollectorService _collectorService;
    private readonly ISignalProcessorService _processorService;
    private readonly IOpportunityEngineService _opportunityEngine;
    private readonly IActionDispatcherService _dispatcherService;
    private readonly IBrandImpactRepository _impactRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly IUserRepository _userRepo;
    private readonly IAgentRepository _agentRepo;
    private readonly ILogger<AgentOrchestrationWorker> _logger;

    public AgentOrchestrationWorker(
        ISignalCollectorService collectorService,
        ISignalProcessorService processorService,
        IOpportunityEngineService opportunityEngine,
        IActionDispatcherService dispatcherService,
        IBrandImpactRepository impactRepo,
        IBrandRepository brandRepo,
        IUserRepository userRepo,
        IAgentRepository agentRepo,
        ILogger<AgentOrchestrationWorker> logger)
    {
        _collectorService = collectorService;
        _processorService = processorService;
        _opportunityEngine = opportunityEngine;
        _dispatcherService = dispatcherService;
        _impactRepo = impactRepo;
        _brandRepo = brandRepo;
        _userRepo = userRepo;
        _agentRepo = agentRepo;
        _logger = logger;
    }

    [Queue("scale")]
    public async Task ExecuteScaleLoopAsync()
    {
        await DispatchBrandJobsAsync("scale");
    }

    [Queue("growth")]
    public async Task ExecuteGrowthLoopAsync()
    {
        await DispatchBrandJobsAsync("growth");
    }

    [Queue("starter")]
    public async Task ExecuteStarterLoopAsync()
    {
        await DispatchBrandJobsAsync("starter");
    }

    [Queue("default")]
    public async Task ExecuteGlobalLoopAsync()
    {
        await DispatchBrandJobsAsync(null);
    }

    /// <summary>
    /// Master dispatcher: runs in sub-seconds and fans out individual background jobs per brand.
    /// This eliminates serial processing bottlenecks and allows horizontal concurrency.
    /// </summary>
    public async Task DispatchBrandJobsAsync(string? targetQueue = null)
    {
        _logger.LogInformation("Dispatching Agent Loop jobs for queue: {Queue}...", targetQueue ?? "ALL");

        var brands = await _impactRepo.GetActiveBrandsForMatchingAsync(limit: 500);
        int enqueuedCount = 0;

        foreach (var brand in brands)
        {
            if (!brand.AgentEnabled)
            {
                continue;
            }

            var owner = await _userRepo.GetUserByIdAsync(brand.OwnerId);
            if (owner == null || !owner.IsSubscriptionActive)
            {
                continue;
            }

            var plan = PlanCatalog.GetByName(owner.PlanName);
            if (!string.IsNullOrEmpty(targetQueue) &&
                !string.Equals(plan.HangfireQueue, targetQueue, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            // Fan out individual background job for this brand
            BackgroundJob.Enqueue<AgentOrchestrationWorker>(w => w.ExecuteSingleBrandLoopAsync(brand.Id));
            enqueuedCount++;
        }

        _logger.LogInformation("Enqueued {Count} parallel brand agent jobs for queue {Queue}", enqueuedCount, targetQueue ?? "ALL");
    }

    /// <summary>
    /// Executes the full agent loop for a single brand in parallel.
    /// </summary>
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteSingleBrandLoopAsync(Guid brandId)
    {
        var brand = await _brandRepo.GetBrandByIdSystemAsync(brandId);
        if (brand == null || !brand.AgentEnabled) return;

        var owner = await _userRepo.GetUserByIdAsync(brand.OwnerId);
        if (owner == null || !owner.IsSubscriptionActive) return;

        _logger.LogInformation("Running parallel Agent Loop for '{BrandName}' (Goal: {Goal})...",
            brand.Name, brand.GrowthGoal ?? "Market Growth");

        try
        {
            // 1. Perceive: Collect multi-source signals
            var rawSignals = await _collectorService.CollectSignalsAsync(brand);

            // 2. Understand: Batch AI classification & relevance scoring
            var processedSignals = await _processorService.ProcessSignalsAsync(brand, rawSignals);

            // 3. Decide: Formulate commercial opportunities & plan concrete actions
            var opportunities = await _opportunityEngine.EvaluateOpportunitiesAsync(brand, processedSignals);
            var plannedActions = await _opportunityEngine.PlanActionsAsync(brand, opportunities);

            // 4. Act: Immediately dispatch any auto-approved actions for this brand
            await _dispatcherService.ProcessPendingActionsAsync();

            _logger.LogInformation("Parallel Agent Loop completed for '{BrandName}': {Sig} signals, {Opp} opps, {Act} actions.",
                brand.Name, rawSignals.Count, opportunities.Count, plannedActions.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in parallel agent loop for brand '{BrandName}' ({BrandId})", brand.Name, brand.Id);
            throw; // Allows Hangfire retry policies
        }
    }

    /// <summary>
    /// Housekeeping: purges processed signals older than 30 days that never became opportunities.
    /// Prevents unbounded database growth.
    /// </summary>
    [Queue("default")]
    public async Task PurgeOldSignalsAsync()
    {
        _logger.LogInformation("Running periodic signals table archival pass...");
        try
        {
            // Executed via Supabase/Npgsql
            await using var conn = new Npgsql.NpgsqlConnection(
                Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") 
                ?? "Host=localhost;Port=5432;Database=markopilot;Username=postgres;Password=postgres");
            await conn.OpenAsync();

            await using var cmd = new Npgsql.NpgsqlCommand(@"
                DELETE FROM signals 
                WHERE is_processed = true 
                  AND id NOT IN (SELECT signal_id FROM opportunities WHERE signal_id IS NOT NULL)
                  AND ingested_at < NOW() - INTERVAL '30 days';", conn);

            var deleted = await cmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Purged {Count} stale signals from database.", deleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to purge old signals");
        }
    }
}
