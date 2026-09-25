using System.Net.Http.Json;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Collectors;

public class RedditCollector : ISignalCollector
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RedditCollector> _logger;

    public SignalSourceType SourceType => SignalSourceType.Reddit;

    public RedditCollector(HttpClient httpClient, ILogger<RedditCollector> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("MarkopilotAgent/2.0 (GrowthIntelligence; contact@markopilot.com)");
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
    }

    public async Task<List<RawSignal>> CollectAsync(Brand brand, CancellationToken ct = default)
    {
        var signals = new List<RawSignal>();

        // Build search terms for Reddit
        var searchTerms = new List<string>();

        if (!string.IsNullOrWhiteSpace(brand.GrowthGoal))
        {
            searchTerms.Add(brand.GrowthGoal);
        }

        if (brand.WatchKeywords != null && brand.WatchKeywords.Count > 0)
        {
            searchTerms.AddRange(brand.WatchKeywords.Take(2));
        }

        if (brand.TargetPainPoints != null && brand.TargetPainPoints.Count > 0)
        {
            searchTerms.Add($"{brand.Industry} {brand.TargetPainPoints.First()}");
        }

        if (searchTerms.Count == 0)
        {
            searchTerms.Add($"{brand.Industry} struggle OR recommend");
        }

        foreach (var term in searchTerms.Take(3))
        {
            try
            {
                var encoded = Uri.EscapeDataString(term);
                var url = $"https://www.reddit.com/search.json?q={encoded}&sort=new&limit=5";

                var response = await _httpClient.GetAsync(url, ct);
                if (!response.IsSuccessStatusCode) continue;

                var doc = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
                if (!doc.TryGetProperty("data", out var data) || !data.TryGetProperty("children", out var children))
                    continue;

                foreach (var child in children.EnumerateArray())
                {
                    if (!child.TryGetProperty("data", out var postData)) continue;

                    var title = postData.TryGetProperty("title", out var t) ? t.GetString() : string.Empty;
                    var selftext = postData.TryGetProperty("selftext", out var s) ? s.GetString() : string.Empty;
                    var permalink = postData.TryGetProperty("permalink", out var p) ? p.GetString() : string.Empty;
                    var author = postData.TryGetProperty("author", out var a) ? a.GetString() : "reddit_user";
                    var subreddit = postData.TryGetProperty("subreddit_name_prefixed", out var sub) ? sub.GetString() : "r/reddit";
                    var createdUtc = postData.TryGetProperty("created_utc", out var cr) ? cr.GetDouble() : 0;

                    if (string.IsNullOrWhiteSpace(title)) continue;

                    var content = string.IsNullOrWhiteSpace(selftext) ? title : $"{title}\n\n{selftext}";
                    if (content.Length > 1000) content = content[..1000] + "...";

                    var postUrl = string.IsNullOrWhiteSpace(permalink) ? "https://reddit.com" : $"https://reddit.com{permalink}";

                    signals.Add(new RawSignal
                    {
                        BrandId = brand.Id,
                        SourceType = SignalSourceType.Reddit,
                        SourceName = $"Reddit ({subreddit})",
                        SourceUrl = postUrl,
                        Title = title,
                        Content = content,
                        Author = $"u/{author}",
                        AuthorProfileUrl = $"https://reddit.com/user/{author}",
                        RawMetadataJson = $"{{\"subreddit\":\"{subreddit}\",\"searchTerm\":\"{term}\"}}",
                        PublishedAt = createdUtc > 0 ? DateTimeOffset.FromUnixTimeSeconds((long)createdUtc) : DateTimeOffset.UtcNow,
                        IngestedAt = DateTimeOffset.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to collect Reddit signals for term '{Term}'", term);
            }
        }

        return signals;
    }
}
