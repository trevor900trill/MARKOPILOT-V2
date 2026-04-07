using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

// ═══════════════════════════════════════════════════
// AI & CONTENT SERVICES
// ═══════════════════════════════════════════════════

/// <summary>
/// Routes AI completion requests to the configured LLM provider (OpenRouter).
/// Used by: Workers (LeadExtractionWorker, SocialPostingWorker, OutreachWorker)
/// </summary>
public interface IAiRoutingService
{
    Task<AiCompletionResponse> CompleteAsync(AiCompletionRequest request);
    string GetModelForTask(AiTask task);
}

/// <summary>
/// High-level content generation: posts, outreach emails, search queries, pillars.
/// Used by: Workers (SocialPostingWorker, LeadExtractionWorker, OutreachWorker)
/// </summary>
public interface IContentGenerationService
{
    // ── Generate ─────────────────────────────────
    Task<GeneratedPost> GeneratePostAsync(Brand brand, string contentPillar, SocialPlatform platform);
    Task<GeneratedEmail> GenerateOutreachEmailAsync(Brand brand, Lead lead);
    Task<GeneratedEmail> GenerateFollowUpEmailAsync(Brand brand, Lead lead, string originalSubject);
    Task<List<string>> SuggestContentPillarsAsync(Brand brand);
    Task<List<string>> GenerateSearchQueriesAsync(Brand brand);
}

// ═══════════════════════════════════════════════════
// LEAD DISCOVERY SERVICE
// ═══════════════════════════════════════════════════

/// <summary>
/// Orchestrates the full lead discovery pipeline: search, scrape, extract, score, validate.
/// Used by: Workers (LeadExtractionWorker)
/// </summary>
public interface ILeadDiscoveryService
{
    // ── Search & Scrape ──────────────────────────
    Task<List<SearchResult>> SearchAsync(string query, bool useExa = false);
    Task<string> ScrapePageAsync(string url);

    // ── AI Extraction & Scoring ──────────────────
    Task<ExtractedEntity?> ExtractEntityAsync(string scrapedText);
    Task<LeadScoreResult> ScoreLeadAsync(Brand brand, ExtractedEntity entity, string sourceUrl);

    // ── Email Validation & Discovery ─────────────
    Task<bool> ValidateEmailAsync(string email);
    Task<string?> DiscoverEmailAsync(string name, string company, string domain);
}

// ═══════════════════════════════════════════════════
// QUOTA & RATE LIMITING
// ═══════════════════════════════════════════════════

/// <summary>
/// Manages per-user usage quotas for leads, posts, and brands.
/// Used by: API (BrandsController, LeadsController, SocialController, UsersController)
///          Workers (LeadExtractionWorker, SocialPostingWorker)
/// </summary>
public interface IQuotaService
{
    // ── Read ──────────────────────────────────────
    Task<QuotaStatus> GetQuotaStatusAsync(Guid userId);
    Task<bool> CanGeneratePostAsync(Guid userId);
    Task<bool> CanDiscoverLeadAsync(Guid userId);
    Task<bool> IsBrandLimitReachedAsync(Guid userId);
    string GetQueueForUser(string planName);

    // ── Update ───────────────────────────────────
    Task IncrementPostsUsedAsync(Guid userId, int count = 1);
    Task IncrementLeadsUsedAsync(Guid userId, int count = 1);
    Task ResetQuotaAsync(Guid userId);
    Task InvalidateQuotaCacheAsync(Guid userId);
}

/// <summary>
/// Distributed rate limiter and circuit breaker for external API calls.
/// Used by: Workers (LeadExtractionWorker — via LeadDiscoveryService)
/// </summary>
public interface IGlobalRateLimiter
{
    Task<bool> TryAcquireAsync(string key, int ratePerMinute);
    Task<bool> IsCircuitOpenAsync(string serviceKey);
    Task RecordFailureAsync(string serviceKey);
    Task RecordSuccessAsync(string serviceKey);
}

// ═══════════════════════════════════════════════════
// ENCRYPTION
// ═══════════════════════════════════════════════════

/// <summary>
/// AES encryption for OAuth tokens at rest.
/// Used by: API (SocialController), Workers (SocialPublishingWorker, OutreachService)
/// </summary>
public interface ITokenEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}

// ═══════════════════════════════════════════════════
// HANGFIRE WORKER CONTRACTS
// These interfaces exist so Hangfire can resolve workers via DI.
// ═══════════════════════════════════════════════════

/// <summary>
/// Runs the automated lead discovery pipeline for a brand.
/// Scheduled by: API (BrandsController, LeadsController)
/// Executed by: Workers (LeadExtractionWorker)
/// </summary>
public interface ILeadExtractionWorker
{
    Task ExecuteAsync(Guid brandId);
}

/// <summary>
/// Runs the automated content generation pipeline for a brand.
/// Scheduled by: API (BrandsController)
/// Executed by: Workers (SocialPostingWorker)
/// </summary>
public interface ISocialPostingWorker
{
    Task ExecuteAsync(Guid brandId);
}

/// <summary>
/// Runs the global outreach email dispatch and follow-up pipeline.
/// Scheduled by: Workers (Program.cs recurring job)
/// Executed by: Workers (OutreachWorker)
/// </summary>
public interface IOutreachWorker
{
    Task ExecuteAsync();
}
