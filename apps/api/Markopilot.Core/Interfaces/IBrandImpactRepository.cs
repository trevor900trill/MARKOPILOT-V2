using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

public interface IBrandImpactRepository
{
    // Sources
    Task<List<IntelligenceSource>> GetActiveSourcesAsync(int limit = 50);
    Task UpdateSourceLastScrapedAsync(Guid sourceId, DateTimeOffset lastScrapedAt);

    // Articles
    Task<Guid?> InsertArticleIfNotExistsAsync(IntelligenceArticle article);
    Task<List<IntelligenceArticle>> GetUnprocessedArticlesAsync(DateTimeOffset since, int limit = 100);

    // Brand Impact Events
    Task<List<BrandImpactEvent>> GetBrandImpactEventsAsync(Guid brandId, string? status = null, string? impactLevel = null, int limit = 50);
    Task<BrandImpactEvent?> GetBrandImpactEventByIdAsync(Guid id);
    Task<Guid> InsertBrandImpactEventAsync(BrandImpactEvent impactEvent);
    Task UpdateBrandImpactEventStatusAsync(Guid id, string status, Guid? actionedPostId = null);
    Task MarkImpactEmailSentAsync(Guid id);
    Task<BrandImpactSummaryDto> GetBrandImpactSummaryAsync(Guid brandId);
    
    // Batch brand matching
    Task<List<Brand>> GetActiveBrandsForMatchingAsync(int limit = 1000);
}
