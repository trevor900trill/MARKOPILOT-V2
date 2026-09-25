using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Collectors;

public class WebSearchCollector : ISignalCollector
{
    private readonly IEnumerable<ISearchClient> _searchClients;
    private readonly ILogger<WebSearchCollector> _logger;

    public SignalSourceType SourceType => SignalSourceType.WebSearch;

    public WebSearchCollector(IEnumerable<ISearchClient> searchClients, ILogger<WebSearchCollector> logger)
    {
        _searchClients = searchClients;
        _logger = logger;
    }

    public async Task<List<RawSignal>> CollectAsync(Brand brand, CancellationToken ct = default)
    {
        var signals = new List<RawSignal>();
        var searchClient = _searchClients.FirstOrDefault();
        if (searchClient == null)
        {
            _logger.LogWarning("No ISearchClient configured for WebSearchCollector.");
            return signals;
        }

        // Build focused search queries dynamically
        var queries = GenerateDynamicQueries(brand);

        foreach (var query in queries.Take(4))
        {
            try
            {
                var results = await searchClient.SearchAsync(query, 5);
                foreach (var res in results)
                {
                    if (string.IsNullOrWhiteSpace(res.Title) || string.IsNullOrWhiteSpace(res.Snippet))
                        continue;

                    signals.Add(new RawSignal
                    {
                        BrandId = brand.Id,
                        SourceType = SignalSourceType.WebSearch,
                        SourceName = "Web Search",
                        SourceUrl = res.Url,
                        Title = res.Title,
                        Content = res.Snippet,
                        RawMetadataJson = $"{{\"query\":\"{query}\"}}",
                        PublishedAt = DateTimeOffset.UtcNow,
                        IngestedAt = DateTimeOffset.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Web search failed for query '{Query}' for brand {BrandName}", query, brand.Name);
            }
        }

        return signals;
    }

    private static List<string> GenerateDynamicQueries(Brand brand)
    {
        var queries = new List<string>();

        // Brand mention search
        queries.Add($"\"{brand.Name}\" news OR review OR discussion");

        // Growth goal search if set
        if (!string.IsNullOrWhiteSpace(brand.GrowthGoal))
        {
            queries.Add($"{brand.GrowthGoal} trending news");
        }

        // Watch keywords
        if (brand.WatchKeywords != null && brand.WatchKeywords.Count > 0)
        {
            var kw = string.Join(" OR ", brand.WatchKeywords.Take(3).Select(k => $"\"{k}\""));
            queries.Add($"{kw} news");
        }

        // Target geography + industry pain points
        var geo = brand.TargetGeographies?.FirstOrDefault() ?? "market";
        var pain = brand.TargetPainPoints?.FirstOrDefault() ?? brand.Industry;
        queries.Add($"{geo} {brand.Industry} {pain} trends");

        return queries;
    }
}
