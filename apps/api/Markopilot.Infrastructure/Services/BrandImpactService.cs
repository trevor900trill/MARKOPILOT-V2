using System.Text.Json;
using System.Xml.Linq;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Services;

public class BrandImpactService : IBrandImpactService
{
    private readonly IBrandImpactRepository _impactRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly ISocialRepository _socialRepo;
    private readonly IUserRepository _userRepo;
    private readonly IAiRoutingService _aiService;
    private readonly IEnumerable<ISearchClient> _searchClients;
    private readonly HttpClient _httpClient;
    private readonly IAlertEmailService? _alertEmailService;
    private readonly ILogger<BrandImpactService> _logger;

    public BrandImpactService(
        IBrandImpactRepository impactRepo,
        IBrandRepository brandRepo,
        ISocialRepository socialRepo,
        IUserRepository userRepo,
        IAiRoutingService aiService,
        IEnumerable<ISearchClient> searchClients,
        HttpClient httpClient,
        ILogger<BrandImpactService> logger,
        IAlertEmailService? alertEmailService = null)
    {
        _impactRepo = impactRepo;
        _brandRepo = brandRepo;
        _socialRepo = socialRepo;
        _userRepo = userRepo;
        _aiService = aiService;
        _searchClients = searchClients;
        _httpClient = httpClient;
        _logger = logger;
        _alertEmailService = alertEmailService;
    }

    public async Task<int> IngestSourcesAsync()
    {
        var sources = await _impactRepo.GetActiveSourcesAsync(limit: 20);
        int totalIngested = 0;

        foreach (var source in sources)
        {
            try
            {
                var articles = new List<IntelligenceArticle>();

                if (!string.IsNullOrEmpty(source.FeedUrl))
                {
                    articles = await FetchRssArticlesAsync(source);
                }
                else
                {
                    articles = await FetchSearchArticlesAsync(source);
                }

                foreach (var article in articles)
                {
                    var insertedId = await _impactRepo.InsertArticleIfNotExistsAsync(article);
                    if (insertedId.HasValue)
                    {
                        totalIngested++;
                    }
                }

                await _impactRepo.UpdateSourceLastScrapedAsync(source.Id, DateTimeOffset.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to ingest source {SourceName} ({SourceUrl})", source.Name, source.Url);
            }
        }

        // Also run a few broad industry queries for real-time coverage
        totalIngested += await IngestBroadIndustrySweepsAsync();

        _logger.LogInformation("Ingested {Count} new intelligence articles", totalIngested);
        return totalIngested;
    }

    public async Task<int> ProcessImpactEvaluationsAsync(string? targetQueue = null)
    {
        var recentArticles = await _impactRepo.GetUnprocessedArticlesAsync(DateTimeOffset.UtcNow.AddDays(-3), limit: 50);
        if (recentArticles.Count == 0)
        {
            _logger.LogInformation("No recent intelligence articles to process");
            return 0;
        }

        var brands = await _impactRepo.GetActiveBrandsForMatchingAsync(limit: 500);
        int totalImpactsGenerated = 0;

        foreach (var brand in brands)
        {
            // Plan-based filtering if targetQueue is specified
            var owner = await _userRepo.GetUserByIdAsync(brand.OwnerId);
            if (owner == null || !owner.IsSubscriptionActive)
            {
                // Automation paused because trial or subscription is inactive/expired
                continue;
            }

            var plan = PlanCatalog.GetByName(owner?.PlanName);

            if (!string.IsNullOrEmpty(targetQueue) && 
                !string.Equals(plan.HangfireQueue, targetQueue, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            // Find matching articles for this brand
            var matchingArticles = FindMatchingArticles(brand, recentArticles);

            foreach (var article in matchingArticles.Take(5)) // Max 5 evaluations per brand cycle
            {
                try
                {
                    var impact = await EvaluateImpactWithAiAsync(brand, article);
                    if (impact != null)
                    {
                        var eventId = await _impactRepo.InsertBrandImpactEventAsync(impact);
                        if (eventId != Guid.Empty)
                        {
                            totalImpactsGenerated++;

                            // 1. Log to Activity Monitor
                            await _brandRepo.InsertActivityAsync(
                                brand.Id,
                                "brand_impact",
                                $"Brand Impact Intelligence: [{impact.ImpactLevel.ToUpper()}] {impact.Title}",
                                new Dictionary<string, object>
                                {
                                    { "impactId", eventId.ToString() },
                                    { "impactLevel", impact.ImpactLevel },
                                    { "sourceName", impact.SourceName ?? "Market Intelligence" },
                                    { "whyItMatters", impact.WhyItMatters }
                                });

                            // 2. If Critical severity, send alert email to brand owner
                            if (string.Equals(impact.ImpactLevel, "critical", StringComparison.OrdinalIgnoreCase) && 
                                owner != null && 
                                !string.IsNullOrEmpty(owner.Email) &&
                                _alertEmailService != null)
                            {
                                var sent = await _alertEmailService.SendCriticalImpactAlertEmailAsync(
                                    owner.Email,
                                    owner.DisplayName ?? brand.Name,
                                    brand.Name,
                                    impact.Title,
                                    impact.Summary,
                                    impact.WhyItMatters,
                                    impact.RecommendedAction,
                                    brand.Id);

                                if (sent)
                                {
                                    await _impactRepo.MarkImpactEmailSentAsync(eventId);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to evaluate impact of article {ArticleId} for brand {BrandId}", article.Id, brand.Id);
                }
            }
        }

        _logger.LogInformation("Processed impact evaluations: generated {Count} impact events", totalImpactsGenerated);
        return totalImpactsGenerated;
    }

    public async Task<BrandImpactSummaryDto> ScanBrandImpactAsync(Guid brandId)
    {
        var brand = await _brandRepo.GetBrandByIdSystemAsync(brandId);
        if (brand == null) throw new ArgumentException("Brand not found");

        var owner = await _userRepo.GetUserByIdAsync(brand.OwnerId);
        if (owner == null || !owner.IsSubscriptionActive)
        {
            throw new InvalidOperationException("Brand Impact scans are paused because your trial or subscription has expired. Please renew your plan in Account to resume.");
        }

        var plan = PlanCatalog.GetByName(owner?.PlanName);

        // Run an on-demand sweep for recent articles
        var recentArticles = await _impactRepo.GetUnprocessedArticlesAsync(DateTimeOffset.UtcNow.AddDays(-7), limit: 100);
        var matched = FindMatchingArticles(brand, recentArticles);

        foreach (var article in matched.Take(3))
        {
            try
            {
                var impact = await EvaluateImpactWithAiAsync(brand, article);
                if (impact != null)
                {
                    var eventId = await _impactRepo.InsertBrandImpactEventAsync(impact);
                    if (eventId != Guid.Empty)
                    {
                        await _brandRepo.InsertActivityAsync(
                            brand.Id,
                            "brand_impact",
                            $"Brand Impact Intelligence: [{impact.ImpactLevel.ToUpper()}] {impact.Title}",
                            new Dictionary<string, object>
                            {
                                { "impactId", eventId.ToString() },
                                { "impactLevel", impact.ImpactLevel }
                            });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "On-demand scan error for brand {BrandId}", brandId);
            }
        }

        var summary = await _impactRepo.GetBrandImpactSummaryAsync(brandId);
        summary.ScanFrequency = plan.ImpactFrequencyLabel;
        return summary;
    }

    public async Task<SocialPost> ConvertImpactToSocialPostAsync(Guid brandId, Guid impactId)
    {
        var brand = await _brandRepo.GetBrandByIdSystemAsync(brandId);
        if (brand == null) throw new ArgumentException("Brand not found");

        var owner = await _userRepo.GetUserByIdAsync(brand.OwnerId);
        if (owner == null || !owner.IsSubscriptionActive)
        {
            throw new InvalidOperationException("Social post generation is paused because your trial or subscription has expired. Please renew your plan in Account to resume.");
        }

        var impact = await _impactRepo.GetBrandImpactEventByIdAsync(impactId);
        if (impact == null) throw new ArgumentException("Impact event not found");

        // Generate high-converting reactive social post
        var prompt = $@"You are the chief brand strategist for {brand.Name} ({brand.Industry} industry).
Brand Description: {brand.Description}
Target Audience: {brand.TargetAudienceDescription}

A significant market/policy/platform update just occurred:
Title: {impact.Title}
Summary: {impact.Summary}
Why It Matters: {impact.WhyItMatters}
Recommended Action: {impact.RecommendedAction}

Write an insightful, authoritative, high-engagement social media post for this brand that reacts to this news.
Tone: {brand.BrandVoiceFormality} and {brand.BrandVoiceAssertiveness}.
Format: Snappy hook, breakdown of the update, actionable takeaway for the target audience, and engaging closing question.
Do NOT include generic buzzwords or robotic filler.";

        var completionResponse = await _aiService.CompleteAsync(new AiCompletionRequest
        {
            Task = AiTask.SocialPostGeneration,
            SystemPrompt = "You are a world-class social media copywriter and brand strategist.",
            UserPrompt = prompt,
            MaxTokens = 500
        });

        var postContent = completionResponse.Content ?? "";

        var socialPost = new SocialPost
        {
            BrandId = brandId,
            Platform = "twitter",
            GeneratedCopy = postContent.Trim(),
            Status = "draft",
            ScheduledFor = DateTimeOffset.UtcNow.AddMinutes(30)
        };

        var created = await _socialRepo.CreatePostAsync(socialPost);

        // Mark impact event as actioned
        await _impactRepo.UpdateBrandImpactEventStatusAsync(impactId, "actioned", created.Id);

        await _brandRepo.InsertActivityAsync(
            brandId,
            "post_drafted",
            $"Drafted reactive social post from market intelligence: {impact.Title}",
            new Dictionary<string, object>
            {
                { "postId", created.Id.ToString() },
                { "impactId", impactId.ToString() }
            });

        return created;
    }

    // ── Helper Ingestion & Evaluation Methods ─────────────────────

    private async Task<List<IntelligenceArticle>> FetchRssArticlesAsync(IntelligenceSource source)
    {
        var articles = new List<IntelligenceArticle>();
        try
        {
            var response = await _httpClient.GetStringAsync(source.FeedUrl!);
            var doc = XDocument.Parse(response);

            var items = doc.Descendants("item").Take(10);
            foreach (var item in items)
            {
                var title = item.Element("title")?.Value?.Trim() ?? "";
                var link = item.Element("link")?.Value?.Trim() ?? "";
                var description = item.Element("description")?.Value?.Trim() ?? "";
                var pubDateStr = item.Element("pubDate")?.Value?.Trim();

                DateTimeOffset pubDate = DateTimeOffset.UtcNow;
                if (!string.IsNullOrEmpty(pubDateStr) && DateTimeOffset.TryParse(pubDateStr, out var parsed))
                {
                    pubDate = parsed;
                }

                if (!string.IsNullOrEmpty(title) && !string.IsNullOrEmpty(link))
                {
                    articles.Add(new IntelligenceArticle
                    {
                        SourceId = source.Id,
                        Title = title,
                        Url = link,
                        ContentSnippet = StripHtml(description),
                        PublishedAt = pubDate,
                        IndustryCategories = source.TargetIndustries,
                        Tags = new List<string> { source.Category }
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to parse RSS feed for {SourceName}", source.Name);
        }
        return articles;
    }

    private async Task<List<IntelligenceArticle>> FetchSearchArticlesAsync(IntelligenceSource source)
    {
        var articles = new List<IntelligenceArticle>();
        var searchClient = _searchClients.FirstOrDefault();
        if (searchClient == null) return articles;

        try
        {
            var results = await searchClient.SearchAsync($"site:{source.Url} policy OR update OR release 2026", maxResults: 5);
            foreach (var res in results)
            {
                articles.Add(new IntelligenceArticle
                {
                    SourceId = source.Id,
                    Title = res.Title,
                    Url = res.Url,
                    ContentSnippet = res.Snippet,
                    PublishedAt = DateTimeOffset.UtcNow,
                    IndustryCategories = source.TargetIndustries,
                    Tags = new List<string> { source.Category }
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Search sweep failed for {SourceName}", source.Name);
        }
        return articles;
    }

    private async Task<int> IngestBroadIndustrySweepsAsync()
    {
        int added = 0;
        var searchClient = _searchClients.FirstOrDefault();
        if (searchClient == null) return 0;

        var queries = new[]
        {
            "tech regulation policy update 2026",
            "Meta Instagram developer API updates 2026",
            "OpenAI ChatGPT search policy updates 2026",
            "B2B SaaS data compliance updates 2026"
        };

        foreach (var query in queries)
        {
            try
            {
                var results = await searchClient.SearchAsync(query, maxResults: 3);
                foreach (var res in results)
                {
                    var article = new IntelligenceArticle
                    {
                        Title = res.Title,
                        Url = res.Url,
                        ContentSnippet = res.Snippet,
                        PublishedAt = DateTimeOffset.UtcNow,
                        IndustryCategories = new List<string> { "tech", "saas", "marketing", "ecommerce" },
                        Tags = new List<string> { "global_sweep" }
                    };

                    var id = await _impactRepo.InsertArticleIfNotExistsAsync(article);
                    if (id.HasValue) added++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Broad sweep query failed: {Query}", query);
            }
        }
        return added;
    }

    private static List<IntelligenceArticle> FindMatchingArticles(Brand brand, List<IntelligenceArticle> articles)
    {
        var matched = new List<IntelligenceArticle>();
        var brandKeywords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrEmpty(brand.Industry)) brandKeywords.Add(brand.Industry);
        if (!string.IsNullOrEmpty(brand.IndustryCustom)) brandKeywords.Add(brand.IndustryCustom);
        foreach (var p in brand.TargetPainPoints) brandKeywords.Add(p);
        foreach (var t in brand.TargetJobTitles) brandKeywords.Add(t);

        // Also add platforms connected
        if (brand.TwitterConnected) { brandKeywords.Add("twitter"); brandKeywords.Add("x"); }
        if (brand.LinkedinConnected) brandKeywords.Add("linkedin");
        if (brand.InstagramConnected) { brandKeywords.Add("instagram"); brandKeywords.Add("meta"); }
        if (brand.TiktokConnected) brandKeywords.Add("tiktok");
        if (brand.GmailConnected) brandKeywords.Add("email");

        foreach (var article in articles)
        {
            bool isIndustryMatch = article.IndustryCategories.Any(c => 
                brandKeywords.Any(k => k.Contains(c, StringComparison.OrdinalIgnoreCase) || c.Contains(k, StringComparison.OrdinalIgnoreCase)));

            bool isContentMatch = brandKeywords.Any(k => 
                article.Title.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                (article.ContentSnippet != null && article.ContentSnippet.Contains(k, StringComparison.OrdinalIgnoreCase)));

            if (isIndustryMatch || isContentMatch)
            {
                matched.Add(article);
            }
        }

        return matched;
    }

    private async Task<BrandImpactEvent?> EvaluateImpactWithAiAsync(Brand brand, IntelligenceArticle article)
    {
        var prompt = $@"You are an expert market analyst evaluating market/tech/regulatory updates for business owners.

BRAND DETAILS:
- Name: {brand.Name}
- Industry: {brand.Industry}
- Description: {brand.Description}
- Target Audience: {brand.TargetAudienceDescription}

NEWS UPDATE / POLICY:
- Title: {article.Title}
- Content Snippet: {article.ContentSnippet}
- URL: {article.Url}

Assess if this update impacts this brand. Return ONLY a valid JSON object matching this schema:
{{
  ""isRelevant"": true,
  ""impactLevel"": ""critical"" | ""high"" | ""moderate"" | ""low"" | ""info"",
  ""title"": ""Clear concise headline in plain English"",
  ""summary"": ""2-3 sentence summary of what changed"",
  ""whyItMatters"": ""1-2 sentences on direct consequence to this brand"",
  ""recommendedAction"": ""1 concrete action the brand owner should take"",
  ""autoDraftHook"": ""A 1-sentence thought leadership hook for social media""
}}

Rules:
- If this has zero impact or relevance to this brand, return {{ ""isRelevant"": false }}
- Use 'critical' ONLY for breaking policy changes, API deprecations affecting connected accounts, or major legal/tax/regulatory compliance shifts.
- Use plain, simple English without confusing buzzwords.";

        var completion = await _aiService.CompleteAsync(new AiCompletionRequest
        {
            Task = AiTask.LeadScoring,
            SystemPrompt = "You are an expert market and tech intelligence analyst. Output only JSON.",
            UserPrompt = prompt,
            MaxTokens = 400
        });

        var rawResponse = completion.Content ?? "";
        var cleanJson = ExtractJson(rawResponse);
        if (string.IsNullOrEmpty(cleanJson)) return null;

        try
        {
            using var doc = JsonDocument.Parse(cleanJson);
            var root = doc.RootElement;

            if (root.TryGetProperty("isRelevant", out var rel) && !rel.GetBoolean())
            {
                return null;
            }

            var impactLevel = root.TryGetProperty("impactLevel", out var lvl) ? lvl.GetString() ?? "info" : "info";
            var title = root.TryGetProperty("title", out var t) ? t.GetString() ?? article.Title : article.Title;
            var summary = root.TryGetProperty("summary", out var s) ? s.GetString() ?? article.ContentSnippet ?? "" : "";
            var whyItMatters = root.TryGetProperty("whyItMatters", out var w) ? w.GetString() ?? "" : "";
            var recommendedAction = root.TryGetProperty("recommendedAction", out var a) ? a.GetString() ?? "" : "";
            var autoDraftHook = root.TryGetProperty("autoDraftHook", out var h) ? h.GetString() : null;

            return new BrandImpactEvent
            {
                BrandId = brand.Id,
                ArticleId = article.Id,
                ImpactLevel = impactLevel.ToLowerInvariant(),
                Title = title,
                Summary = summary,
                WhyItMatters = whyItMatters,
                RecommendedAction = recommendedAction,
                AutoDraftHook = autoDraftHook,
                SourceUrl = article.Url,
                SourceName = article.Tags.FirstOrDefault() ?? "Industry Intelligence",
                Status = "unread",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to parse AI impact response: {Response}", rawResponse);
            return null;
        }
    }

    private static string ExtractJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start >= 0 && end > start)
        {
            return text.Substring(start, end - start + 1);
        }
        return string.Empty;
    }

    private static string StripHtml(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return System.Text.RegularExpressions.Regex.Replace(input, "<.*?>", string.Empty).Trim();
    }
}
