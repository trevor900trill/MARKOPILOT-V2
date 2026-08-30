using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

public interface IBrandImpactService
{
    /// <summary>
    /// Ingests new articles from registered sources and broad industry search sweeps (Fan-in pipeline).
    /// </summary>
    Task<int> IngestSourcesAsync();

    /// <summary>
    /// Matches recent ingested articles against active brands based on industry, keywords, and tech stack (Reverse Index Matcher).
    /// Generates AI impact assessments, logs to activity monitor, and dispatches critical alert emails.
    /// </summary>
    Task<int> ProcessImpactEvaluationsAsync(string? targetQueue = null);

    /// <summary>
    /// Runs an on-demand impact scan for a specific brand.
    /// </summary>
    Task<BrandImpactSummaryDto> ScanBrandImpactAsync(Guid brandId);

    /// <summary>
    /// Converts a brand impact event into an AI-drafted reactive social post.
    /// </summary>
    Task<SocialPost> ConvertImpactToSocialPostAsync(Guid brandId, Guid impactId);
}
