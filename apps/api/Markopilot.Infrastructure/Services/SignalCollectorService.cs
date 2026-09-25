using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class SignalCollectorService : ISignalCollectorService
{
    private readonly IEnumerable<ISignalCollector> _collectors;
    private readonly IAgentRepository _agentRepo;
    private readonly ILogger<SignalCollectorService> _logger;

    public SignalCollectorService(
        IEnumerable<ISignalCollector> collectors,
        IAgentRepository agentRepo,
        ILogger<SignalCollectorService> logger)
    {
        _collectors = collectors;
        _agentRepo = agentRepo;
        _logger = logger;
    }

    public async Task<List<RawSignal>> CollectSignalsAsync(Brand brand, CancellationToken ct = default)
    {
        _logger.LogInformation("Starting signal collection for brand {BrandName} ({BrandId}) across {Count} collectors...",
            brand.Name, brand.Id, _collectors.Count());

        var allSignals = new List<RawSignal>();
        var tasks = _collectors.Select(async collector =>
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(TimeSpan.FromSeconds(30)); // 30 sec max per collector

                var collected = await collector.CollectAsync(brand, cts.Token);
                return collected;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Collector {SourceType} failed for brand {BrandName}", collector.SourceType, brand.Name);
                return [];
            }
        });

        var results = await Task.WhenAll(tasks);
        foreach (var batch in results)
        {
            allSignals.AddRange(batch);
        }

        // Deduplicate by URL or title
        var uniqueSignals = allSignals
            .GroupBy(s => !string.IsNullOrWhiteSpace(s.SourceUrl) ? s.SourceUrl : s.Title)
            .Select(g => g.First())
            .ToList();

        if (uniqueSignals.Count > 0)
        {
            await _agentRepo.SaveSignalsAsync(uniqueSignals);
            _logger.LogInformation("Saved {Count} unique signals for brand {BrandName}", uniqueSignals.Count, brand.Name);
        }
        else
        {
            _logger.LogInformation("No new signals collected for brand {BrandName}", brand.Name);
        }

        return uniqueSignals;
    }
}
