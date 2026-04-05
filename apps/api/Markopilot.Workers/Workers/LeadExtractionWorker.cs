using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Supabase;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Hangfire scheduled job that runs the lead discovery pipeline for a specific brand.
/// Uses ISearchClient implementations (Serper/Exa) for initial search,
/// then IAiRoutingService for entity extraction and scoring.
/// Per spec Section 8.1.
/// </summary>
public class LeadExtractionWorker : ILeadExtractionWorker
{
    private readonly IEnumerable<ISearchClient> _searchClients;
    private readonly IAiRoutingService _aiService;
    private readonly IContentGenerationService _contentService;
    private readonly SupabaseRepository _repo;
    private readonly IGlobalRateLimiter _rateLimiter;
    private readonly ILogger<LeadExtractionWorker> _logger;

    public LeadExtractionWorker(
        IEnumerable<ISearchClient> searchClients,
        IAiRoutingService aiService,
        IContentGenerationService contentService,
        SupabaseRepository repo,
        IGlobalRateLimiter rateLimiter,
        ILogger<LeadExtractionWorker> logger)
    {
        _searchClients = searchClients;
        _aiService = aiService;
        _contentService = contentService;
        _repo = repo;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(Guid brandId)
    {
        _logger.LogInformation("Starting lead extraction for Brand: {BrandId}", brandId);

        var brand = await _repo.GetBrandByIdSystemAsync(brandId);

        if (brand == null)
        {
            _logger.LogWarning("Brand {BrandId} not found, cannot extract leads.", brandId);
            return;
        }

        // 1. Generate search queries using AI
        List<string> searchQueries;
        try
        {
            searchQueries = await _contentService.GenerateSearchQueriesAsync(brand);
            _logger.LogInformation("Generated {Count} search queries for brand {BrandId}.",
                searchQueries.Count, brandId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate search queries for brand {BrandId}.", brandId);
            await _repo.InsertActivityAsync(brandId, "error",
                $"Lead discovery failed: could not generate search queries. {ex.Message}");
            return;
        }

        // 2. Execute searches and collect results
        var allResults = new List<SearchResult>();
        var serperClient = _searchClients.FirstOrDefault(c => c.Provider == "serper");
        var exaClient = _searchClients.FirstOrDefault(c => c.Provider == "exa");

        foreach (var query in searchQueries)
        {
            try
            {
                // Route decision: use Exa for people/LinkedIn queries, Serper for broad queries
                var isPersonQuery = query.Contains("linkedin.com/in", StringComparison.OrdinalIgnoreCase)
                    || query.Contains("speaker", StringComparison.OrdinalIgnoreCase)
                    || query.Contains("author", StringComparison.OrdinalIgnoreCase);

                var client = isPersonQuery && exaClient != null ? exaClient : serperClient;
                if (client == null)
                {
                    _logger.LogWarning("No search client available for query: {Query}", query);
                    continue;
                }

                var results = await client.SearchAsync(query, maxResults: 10);
                allResults.AddRange(results);
                _logger.LogDebug("Query '{Query}' returned {Count} results via {Provider}.",
                    query, results.Count, client.Provider);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Search failed for query: {Query}", query);
            }
        }

        _logger.LogInformation("Collected {Count} total search results for brand {BrandId}.",
            allResults.Count, brandId);

        // 3. Deduplicate by URL
        var uniqueResults = new List<SearchResult>();
        foreach (var result in allResults)
        {
            if (string.IsNullOrEmpty(result.Url)) continue;
            var exists = await _repo.LeadSourceUrlExistsAsync(brandId, result.Url);
            if (!exists)
                uniqueResults.Add(result);
        }

        _logger.LogInformation("{Count} unique new results after deduplication.", uniqueResults.Count);

        // 4. Entity extraction + scoring via AI (will be fully implemented in Step 19)
        // For now, create leads from search results with basic data
        var qualifiedLeads = new List<Lead>();

        foreach (var result in uniqueResults.Take(50)) // Max 50 URLs per run per spec
        {
            try
            {
                // Extract entities from the search result snippet using AI
                var extractionRequest = new AiCompletionRequest
                {
                    Task = AiTask.EntityExtraction,
                    SystemPrompt = "Extract contact information from the following text. Return JSON with: name, jobTitle, company, email, linkedinUrl, twitterHandle, location, confidence (low/medium/high).",
                    UserPrompt = $"Title: {result.Title}\nURL: {result.Url}\nSnippet: {result.Snippet}",
                    Temperature = 0.1,
                    MaxTokens = 512
                };

                var extractionResponse = await _aiService.CompleteAsync(extractionRequest);
                var entity = System.Text.Json.JsonSerializer.Deserialize<ExtractedEntity>(
                    extractionResponse.Content,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (entity == null || entity.Confidence == "low") continue;

                // Score the lead
                var scoringRequest = new AiCompletionRequest
                {
                    Task = AiTask.LeadScoring,
                    SystemPrompt = $"Score this lead 0-100 for fit with: {brand.Name} ({brand.Industry}). Target: {brand.TargetAudienceDescription}. Return JSON: {{\"score\": int, \"summary\": \"2 sentences\"}}",
                    UserPrompt = $"Name: {entity.Name}\nJob Title: {entity.JobTitle}\nCompany: {entity.Company}\nLocation: {entity.Location}\nSource: {result.Url}",
                    Temperature = 0.1,
                    MaxTokens = 256
                };

                var scoringResponse = await _aiService.CompleteAsync(scoringRequest);
                var scoreResult = System.Text.Json.JsonSerializer.Deserialize<LeadScoreResult>(
                    scoringResponse.Content,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (scoreResult == null || scoreResult.Score < 30) continue;

                qualifiedLeads.Add(new Lead
                {
                    Id = Guid.NewGuid(),
                    BrandId = brandId,
                    DiscoveredVia = result.Title,
                    SourceUrl = result.Url,
                    Name = entity.Name,
                    JobTitle = entity.JobTitle,
                    Company = entity.Company,
                    Email = entity.Email,
                    LinkedinUrl = entity.LinkedinUrl,
                    TwitterHandle = entity.TwitterHandle,
                    Location = entity.Location,
                    AiSummary = scoreResult.Summary,
                    LeadScore = scoreResult.Score,
                    Status = "new",
                    DiscoveredAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to process search result: {Url}", result.Url);
            }
        }

        _logger.LogInformation("{Count} leads passed qualification (score >= 30).", qualifiedLeads.Count);

        // 5. Bulk insert qualified leads
        if (qualifiedLeads.Count > 0)
        {
            await _repo.BulkInsertLeadsAsync(qualifiedLeads);
            await _repo.InsertActivityAsync(brandId, "lead_discovered",
                $"Discovered {qualifiedLeads.Count} new leads.",
                new Dictionary<string, object> { ["count"] = qualifiedLeads.Count });
            _logger.LogInformation("Inserted {Count} leads for brand {BrandId}.", qualifiedLeads.Count, brandId);
        }
    }
}
