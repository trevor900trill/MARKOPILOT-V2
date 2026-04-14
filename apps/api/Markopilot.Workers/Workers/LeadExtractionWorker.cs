using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Hangfire scheduled job that runs the lead discovery pipeline for a specific brand.
/// Uses ILeadDiscoveryService for search, scraping, entity extraction, scoring, and validation.
/// Per spec Section 8.1.
/// </summary>
public class LeadExtractionWorker : ILeadExtractionWorker
{
    private readonly ILeadDiscoveryService _discoveryService;
    private readonly IContentGenerationService _contentService;
    private readonly IQuotaService _quotaService;
    private readonly ILeadRepository _leadRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly IGlobalRateLimiter _rateLimiter;
    private readonly ILogger<LeadExtractionWorker> _logger;

    public LeadExtractionWorker(
        ILeadDiscoveryService discoveryService,
        IContentGenerationService contentService,
        IQuotaService quotaService,
        ILeadRepository leadRepo,
        IBrandRepository brandRepo,
        IGlobalRateLimiter rateLimiter,
        ILogger<LeadExtractionWorker> logger)
    {
        _discoveryService = discoveryService;
        _contentService = contentService;
        _quotaService = quotaService;
        _leadRepo = leadRepo;
        _brandRepo = brandRepo;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(Guid brandId)
    {
        _logger.LogInformation("Starting lead extraction for Brand: {BrandId}", brandId);

        var brand = await _brandRepo.GetBrandByIdSystemAsync(brandId);
        if (brand == null)
        {
            _logger.LogWarning("Brand {BrandId} not found. Removing recurring job.", brandId);
            RecurringJob.RemoveIfExists($"brand-leads-gen-{brandId}");
            return;
        }

        if (!brand.AutomationLeadsEnabled)
        {
            _logger.LogInformation("Brand {BrandId} has automation leads discovering disabled. Removing recurring job.", brandId);
            RecurringJob.RemoveIfExists($"brand-leads-gen-{brandId}");
            return;
        }

        var canDiscover = await _quotaService.CanDiscoverLeadAsync(brand.OwnerId);
        if (!canDiscover)
        {
            _logger.LogWarning("Brand {BrandId} owner has exceeded their leads quota.", brandId);
            await _brandRepo.InsertActivityAsync(brandId, "quota_warning", "Automated lead discovery paused because lead quota is exhausted.");
            return;
        }

        // 1. Generate search queries using AI
        List<string> searchQueries;
        try
        {
            searchQueries = await _contentService.GenerateSearchQueriesAsync(brand);
            _logger.LogInformation("Generated {Count} search queries for brand {BrandId}.", searchQueries.Count, brandId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate search queries for brand {BrandId}.", brandId);
            await _brandRepo.InsertActivityAsync(brandId, "error", $"Lead discovery failed: could not generate search queries. {ex.Message}");
            return;
        }

        // 2. Execute searches and collect results
        var allResults = new List<SearchResult>();
        foreach (var query in searchQueries)
        {
            try
            {
                _logger.LogInformation("Executing search query: {Query}", query);
                var isPersonQuery = query.Contains("linkedin.com/in", StringComparison.OrdinalIgnoreCase)
                    || query.Contains("speaker", StringComparison.OrdinalIgnoreCase)
                    || query.Contains("author", StringComparison.OrdinalIgnoreCase);

                var results = await _discoveryService.SearchAsync(query, useExa: isPersonQuery);
                allResults.AddRange(results);
                _logger.LogDebug("Query '{Query}' returned {Count} results.", query, results.Count);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Search failed for query: {Query}", query);
            }
        }

        _logger.LogInformation("Collected {Count} total search results for brand {BrandId}.", allResults.Count, brandId);

        // 3. Deduplicate by URL
        var uniqueResults = new List<SearchResult>();
        foreach (var result in allResults)
        {
            if (string.IsNullOrEmpty(result.Url)) continue;
            var exists = await _leadRepo.LeadSourceUrlExistsAsync(brandId, result.Url);
            if (!exists && !uniqueResults.Any(r => r.Url == result.Url))
                uniqueResults.Add(result);
        }

        _logger.LogInformation("{Count} unique new results after deduplication.", uniqueResults.Count);

        // 4. Processing Phase: Scraping, AI Extraction, Validation, Scoring
        var qualifiedLeads = new List<Lead>();
        int dailyLimit = brand.AutomationLeadsPerDay > 0 ? brand.AutomationLeadsPerDay : 50;
        int leadsFoundForPerformance = 0;
        int highQualityCount = 0;
        int totalScore = 0;

        _logger.LogInformation("Processing {Count} unique results for brand {BrandId}. Daily limit: {DailyLimit}", uniqueResults.Count, brandId, dailyLimit);
        
        foreach (var result in uniqueResults.Take(dailyLimit))
        {
            try
            {
                // 1. Get high-quality page context
                string scrapedText = result.RawContent ?? string.Empty;
                
                if (string.IsNullOrWhiteSpace(scrapedText))
                {
                    scrapedText = await _discoveryService.ScrapePageAsync(result.Url);
                }

                if (string.IsNullOrWhiteSpace(scrapedText))
                {
                    scrapedText = result.Title + "\n" + result.Snippet + "\n" + result.Url;
                }

                // 2. Extract structured lead data from the rich text
                var entity = await _discoveryService.ExtractEntityAsync(scrapedText);
                if (entity == null || entity.Confidence == "low") continue;

                // ── GLOBAL DEDUPLICATION BY FINGERPRINT ─────
                var fingerprint = GenerateFingerprint(entity);
                var existingLead = await _leadRepo.GetLeadByFingerprintAsync(fingerprint, TimeSpan.FromDays(7));
                
                if (existingLead != null)
                {
                    _logger.LogInformation("Found duplicate lead globally (extracted {Time} ago). Reusing data for brand {BrandId}.", 
                        existingLead.DiscoveredAt, brandId);
                    
                    var cloned = CloneLeadForBrand(existingLead, brandId, result.Url);
                    qualifiedLeads.Add(cloned);
                    
                    leadsFoundForPerformance++;
                    if (cloned.LeadScore > 60) highQualityCount++;
                    totalScore += cloned.LeadScore;
                    continue;
                }

                _logger.LogInformation("Extracted entity: {Name} at {Company}", entity.Name, entity.Company);

                // 3. Identification Phase (Email discovery moved to EmailEnrichmentWorker)
                // We just store the entity name/company/source for now.
                
                var scoreResult = await _discoveryService.ScoreLeadAsync(brand, entity, result.Url);
                if (scoreResult.Score < 30) continue;

                var normalizedLinkedin = NormalizeLinkedinUrl(entity.LinkedinUrl);

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
                    EmailStatus = string.IsNullOrWhiteSpace(entity.Email) ? "unverified" : "extracted",
                    Fingerprint = fingerprint,
                    LinkedinUrl = normalizedLinkedin,
                    TwitterHandle = entity.TwitterHandle,
                    Location = entity.Location,
                    AiSummary = scoreResult.Summary,
                    LeadScore = scoreResult.Score,
                    Status = "new",
                    DiscoveredAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                });

                leadsFoundForPerformance++;
                if (scoreResult.Score > 60) highQualityCount++;
                totalScore += scoreResult.Score;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to completely process search result: {Url}", result.Url);
            }
        }

        // 5. Log performance for first query (simplification for beta)
        if (searchQueries.Count > 0 && leadsFoundForPerformance > 0)
        {
            await _brandRepo.LogQueryPerformanceAsync(new SearchQueryHistory
            {
                BrandId = brandId,
                QueryText = searchQueries[0],
                LeadsGenerated = leadsFoundForPerformance,
                HighQualityCount = highQualityCount,
                AverageLeadScore = (double)totalScore / leadsFoundForPerformance,
                LastRunAt = DateTimeOffset.UtcNow
            });
        }

        _logger.LogInformation("{Count} leads passed complete qualification.", qualifiedLeads.Count);

        // 6. Bulk insert strictly curated qualified leads
        if (qualifiedLeads.Count > 0)
        {
            await _leadRepo.BulkInsertLeadsAsync(qualifiedLeads);
            await _quotaService.IncrementLeadsUsedAsync(brand.OwnerId, qualifiedLeads.Count);
            
            await _brandRepo.InsertActivityAsync(brandId, "lead_discovered",
                $"Discovered and qualified {qualifiedLeads.Count} new leads.",
                new Dictionary<string, object> { ["count"] = qualifiedLeads.Count });
                
            _logger.LogInformation("Inserted {Count} successfully sourced leads for brand {BrandId}.", qualifiedLeads.Count, brandId);
        }
    }

    private string GenerateFingerprint(ExtractedEntity entity)
    {
        var raw = !string.IsNullOrWhiteSpace(entity.Email) 
            ? entity.Email.ToLowerInvariant().Trim() 
            : $"{entity.Name?.ToLowerInvariant().Trim()}|{entity.Company?.ToLowerInvariant().Trim()}";
            
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }

    private Lead CloneLeadForBrand(Lead existing, Guid brandId, string sourceUrl)
    {
        return new Lead
        {
            Id = Guid.NewGuid(),
            BrandId = brandId,
            DiscoveredVia = existing.DiscoveredVia,
            SourceUrl = sourceUrl,
            Name = existing.Name,
            JobTitle = existing.JobTitle,
            Company = existing.Company,
            Email = existing.Email,
            EmailStatus = existing.EmailStatus,
            Fingerprint = existing.Fingerprint,
            LinkedinUrl = existing.LinkedinUrl,
            TwitterHandle = existing.TwitterHandle,
            Location = existing.Location,
            AiSummary = existing.AiSummary,
            LeadScore = existing.LeadScore,
            Status = "new",
            DiscoveredAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    private string? NormalizeLinkedinUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        var linkedinUrl = url.Trim();
        if (!linkedinUrl.StartsWith("http")) linkedinUrl = "https://" + linkedinUrl;
        if (linkedinUrl.Contains("linkedin.com") && !linkedinUrl.Contains("www.linkedin.com"))
        {
            linkedinUrl = linkedinUrl.Replace("https://linkedin.com", "https://www.linkedin.com")
                                     .Replace("http://linkedin.com", "https://www.linkedin.com");
        }
        return linkedinUrl;
    }
}
