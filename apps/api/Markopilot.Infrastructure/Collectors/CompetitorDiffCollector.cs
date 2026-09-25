using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Search;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Collectors;

public class CompetitorDiffCollector : ISignalCollector
{
    private readonly JinaReaderClient _jinaReader;
    private readonly ILogger<CompetitorDiffCollector> _logger;

    public SignalSourceType SourceType => SignalSourceType.CompetitorDiff;

    public CompetitorDiffCollector(JinaReaderClient jinaReader, ILogger<CompetitorDiffCollector> logger)
    {
        _jinaReader = jinaReader;
        _logger = logger;
    }

    public async Task<List<RawSignal>> CollectAsync(Brand brand, CancellationToken ct = default)
    {
        var signals = new List<RawSignal>();
        if (brand.CompetitorUrls == null || brand.CompetitorUrls.Count == 0)
        {
            return signals;
        }

        foreach (var compUrl in brand.CompetitorUrls.Take(3))
        {
            try
            {
                var content = await _jinaReader.FetchContentAsync(compUrl);
                if (string.IsNullOrWhiteSpace(content)) continue;

                // Take first 1200 characters which typically contains hero header, announcements, or features
                var excerpt = content.Length > 1200 ? content[..1200] + "..." : content;

                // Derive title from URL domain or first heading
                var uri = new Uri(compUrl.StartsWith("http") ? compUrl : $"https://{compUrl}");
                var domain = uri.Host.Replace("www.", "");

                signals.Add(new RawSignal
                {
                    BrandId = brand.Id,
                    SourceType = SignalSourceType.CompetitorDiff,
                    SourceName = $"Competitor ({domain})",
                    SourceUrl = compUrl,
                    Title = $"Competitor update: {domain}",
                    Content = excerpt,
                    RawMetadataJson = $"{{\"competitorUrl\":\"{compUrl}\"}}",
                    PublishedAt = DateTimeOffset.UtcNow,
                    IngestedAt = DateTimeOffset.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to inspect competitor site {Url} for brand {BrandName}", compUrl, brand.Name);
            }
        }

        return signals;
    }
}
