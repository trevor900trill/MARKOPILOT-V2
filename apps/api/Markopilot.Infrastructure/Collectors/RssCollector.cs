using System.Text.Json;
using System.Xml.Linq;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Markopilot.Infrastructure.Collectors;

public class RssCollector : ISignalCollector
{
    private readonly HttpClient _httpClient;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RssCollector> _logger;

    public SignalSourceType SourceType => SignalSourceType.Rss;

    private const string CACHE_KEY = "agent:shared_rss_signals";
    private const int CACHE_TTL_MINUTES = 15;

    private static readonly List<(string Name, string FeedUrl)> DefaultFeeds =
    [
        ("TechCrunch", "https://techcrunch.com/category/enterprise/feed/"),
        ("Meta Developers", "https://developers.facebook.com/blog/rss"),
        ("Google Search Central", "https://developers.google.com/search/blog/feeds/posts/default"),
        ("OpenAI Blog", "https://openai.com/news/rss.xml"),
        ("Hacker News Top", "https://news.ycombinator.com/rss")
    ];

    public RssCollector(
        HttpClient httpClient,
        ILogger<RssCollector> logger,
        IConnectionMultiplexer? redis = null)
    {
        _httpClient = httpClient;
        _logger = logger;
        _redis = redis;
        _httpClient.Timeout = TimeSpan.FromSeconds(15);
    }

    public async Task<List<RawSignal>> CollectAsync(Brand brand, CancellationToken ct = default)
    {
        // Try reading cached parsed RSS items from Redis
        var cachedItems = await TryGetCachedRssItemsAsync();
        if (cachedItems != null && cachedItems.Count > 0)
        {
            return cachedItems.Select(c => new RawSignal
            {
                BrandId = brand.Id,
                SourceType = SignalSourceType.Rss,
                SourceName = c.SourceName,
                SourceUrl = c.SourceUrl,
                Title = c.Title,
                Content = c.Content,
                Author = c.Author,
                PublishedAt = c.PublishedAt,
                IngestedAt = DateTimeOffset.UtcNow
            }).ToList();
        }

        var signals = new List<RawSignal>();
        var itemsToCache = new List<CachedRssItem>();

        foreach (var (sourceName, feedUrl) in DefaultFeeds)
        {
            try
            {
                using var response = await _httpClient.GetAsync(feedUrl, ct);
                if (!response.IsSuccessStatusCode) continue;

                var xml = await response.Content.ReadAsStringAsync(ct);
                var doc = XDocument.Parse(xml);

                var items = doc.Descendants("item").ToList();
                if (items.Count == 0)
                {
                    items = doc.Descendants(XName.Get("entry", "http://www.w3.org/2005/Atom")).ToList();
                }

                foreach (var item in items.Take(10))
                {
                    var title = item.Element("title")?.Value
                        ?? item.Element(XName.Get("title", "http://www.w3.org/2005/Atom"))?.Value
                        ?? "Untitled";

                    var link = item.Element("link")?.Value
                        ?? item.Element(XName.Get("link", "http://www.w3.org/2005/Atom"))?.Attribute("href")?.Value
                        ?? feedUrl;

                    var summary = item.Element("description")?.Value
                        ?? item.Element(XName.Get("summary", "http://www.w3.org/2005/Atom"))?.Value
                        ?? item.Element(XName.Get("content", "http://www.w3.org/2005/Atom"))?.Value
                        ?? title;

                    summary = System.Text.RegularExpressions.Regex.Replace(summary, "<.*?>", string.Empty);

                    var pubDateStr = item.Element("pubDate")?.Value
                        ?? item.Element(XName.Get("published", "http://www.w3.org/2005/Atom"))?.Value
                        ?? item.Element(XName.Get("updated", "http://www.w3.org/2005/Atom"))?.Value;

                    DateTimeOffset publishedAt = DateTimeOffset.UtcNow;
                    if (!string.IsNullOrWhiteSpace(pubDateStr) && DateTimeOffset.TryParse(pubDateStr, out var parsedDate))
                    {
                        publishedAt = parsedDate;
                    }

                    var cachedItem = new CachedRssItem
                    {
                        SourceName = sourceName,
                        SourceUrl = link,
                        Title = title.Trim(),
                        Content = summary.Trim(),
                        Author = sourceName,
                        PublishedAt = publishedAt
                    };

                    itemsToCache.Add(cachedItem);

                    signals.Add(new RawSignal
                    {
                        BrandId = brand.Id,
                        SourceType = SignalSourceType.Rss,
                        SourceName = sourceName,
                        SourceUrl = link,
                        Title = title.Trim(),
                        Content = summary.Trim(),
                        Author = sourceName,
                        PublishedAt = publishedAt,
                        IngestedAt = DateTimeOffset.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch RSS feed {FeedUrl}", feedUrl);
            }
        }

        // Cache in Redis for subsequent brands in this cycle
        if (itemsToCache.Count > 0 && _redis != null)
        {
            try
            {
                var db = _redis.GetDatabase();
                var json = JsonSerializer.Serialize(itemsToCache);
                await db.StringSetAsync(CACHE_KEY, json, TimeSpan.FromMinutes(CACHE_TTL_MINUTES));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cache RSS items in Redis");
            }
        }

        return signals;
    }

    private async Task<List<CachedRssItem>?> TryGetCachedRssItemsAsync()
    {
        if (_redis == null) return null;
        try
        {
            var db = _redis.GetDatabase();
            var json = await db.StringGetAsync(CACHE_KEY);
            if (!json.IsNullOrEmpty)
            {
                return JsonSerializer.Deserialize<List<CachedRssItem>>((string)json!);
            }
        }
        catch { }
        return null;
    }

    private class CachedRssItem
    {
        public string? SourceName { get; set; }
        public string? SourceUrl { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Author { get; set; }
        public DateTimeOffset PublishedAt { get; set; }
    }
}
