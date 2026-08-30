using Hangfire;
using Markopilot.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

public class BrandImpactWorker
{
    private readonly IBrandImpactService _impactService;
    private readonly ILogger<BrandImpactWorker> _logger;

    public BrandImpactWorker(
        IBrandImpactService impactService,
        ILogger<BrandImpactWorker> logger)
    {
        _impactService = impactService;
        _logger = logger;
    }

    /// <summary>
    /// Ingests sources & runs sweeps for high-frequency (Scale plan) brands.
    /// </summary>
    [Queue("scale")]
    public async Task ExecuteScalePlanAsync()
    {
        _logger.LogInformation("Executing Brand Impact Worker [Scale Plan Queue]");
        await _impactService.IngestSourcesAsync();
        await _impactService.ProcessImpactEvaluationsAsync("scale");
    }

    /// <summary>
    /// Ingests sources & runs daily sweeps for Growth plan brands.
    /// </summary>
    [Queue("growth")]
    public async Task ExecuteGrowthPlanAsync()
    {
        _logger.LogInformation("Executing Brand Impact Worker [Growth Plan Queue]");
        await _impactService.IngestSourcesAsync();
        await _impactService.ProcessImpactEvaluationsAsync("growth");
    }

    /// <summary>
    /// Ingests sources & runs weekly sweeps for Starter plan brands.
    /// </summary>
    [Queue("starter")]
    public async Task ExecuteStarterPlanAsync()
    {
        _logger.LogInformation("Executing Brand Impact Worker [Starter Plan Queue]");
        await _impactService.IngestSourcesAsync();
        await _impactService.ProcessImpactEvaluationsAsync("starter");
    }

    /// <summary>
    /// Global sweep across all active queues.
    /// </summary>
    [Queue("default")]
    public async Task ExecuteGlobalAsync()
    {
        _logger.LogInformation("Executing Global Brand Impact Worker");
        await _impactService.IngestSourcesAsync();
        await _impactService.ProcessImpactEvaluationsAsync();
    }
}
