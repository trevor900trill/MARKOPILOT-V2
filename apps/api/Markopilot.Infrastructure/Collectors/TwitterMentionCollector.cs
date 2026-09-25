using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Collectors;

public class TwitterMentionCollector : ISignalCollector
{
    private readonly IEnumerable<ISearchClient> _searchClients;
    private readonly ILogger<TwitterMentionCollector> _logger;

    public SignalSourceType SourceType => SignalSourceType.TwitterMention;

    public TwitterMentionCollector(IEnumerable<ISearchClient> searchClients, ILogger<TwitterMentionCollector> logger)
    {
        _searchClients = searchClients;
        _logger = logger;
    }

    public async Task<List<RawSignal>> CollectAsync(Brand brand, CancellationToken ct = default)
    {
        var signals = new List<RawSignal>();
        var searchClient = _searchClients.FirstOrDefault();
        if (searchClient == null) return signals;

        // Search X/Twitter for mentions of brand or handle
        var queries = new List<string>();
        if (!string.IsNullOrWhiteSpace(brand.TwitterUsername))
        {
            queries.Add($"site:x.com OR site:twitter.com @{brand.TwitterUsername.TrimStart('@')}");
        }
        queries.Add($"site:x.com OR site:twitter.com \"{brand.Name}\"");

        foreach (var query in queries)
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
                        SourceType = SignalSourceType.TwitterMention,
                        SourceName = "X (Twitter)",
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
                _logger.LogWarning(ex, "Failed to collect Twitter mentions for brand {BrandName}", brand.Name);
            }
        }

        return signals;
    }
}
