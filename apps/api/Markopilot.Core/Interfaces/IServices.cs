using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

public interface IBrandService
{
    Task<Brand> CreateAsync(Brand brand);
    Task<Brand?> GetByIdAsync(Guid brandId, Guid ownerId);
    Task<List<Brand>> GetByOwnerAsync(Guid ownerId);
    Task<Brand> UpdateAsync(Brand brand);
    Task ArchiveAsync(Guid brandId, Guid ownerId);
    Task<int> CountByOwnerAsync(Guid ownerId);
}

public interface IAiRoutingService
{
    Task<AiCompletionResponse> CompleteAsync(AiCompletionRequest request);
    string GetModelForTask(AiTask task);
}

public interface IContentGenerationService
{
    Task<GeneratedPost> GeneratePostAsync(Brand brand, string contentPillar, SocialPlatform platform);
    Task<GeneratedEmail> GenerateOutreachEmailAsync(Brand brand, Lead lead);
    Task<GeneratedEmail> GenerateFollowUpEmailAsync(Brand brand, Lead lead, string originalSubject);
    Task<List<string>> SuggestContentPillarsAsync(Brand brand);
    Task<List<string>> GenerateSearchQueriesAsync(Brand brand);
}

public interface ISocialPostingService
{
    Task<string> PublishAsync(Brand brand, SocialPost post);
    Task<bool> RefreshTokenAsync(Brand brand, SocialPlatform platform);
    Task<bool> ValidateConnectionAsync(Brand brand, SocialPlatform platform);
}

public interface ILeadDiscoveryService
{
    Task<List<SearchResult>> SearchAsync(string query, bool useExa = false);
    Task<string> ScrapePageAsync(string url);
    Task<ExtractedEntity?> ExtractEntityAsync(string scrapedText);
    Task<LeadScoreResult> ScoreLeadAsync(Brand brand, ExtractedEntity entity, string sourceUrl);
    Task<bool> ValidateEmailAsync(string email);
}

public interface ILeadEnrichmentService
{
    Task<Lead> EnrichLeadAsync(Lead lead);
}

public interface IEmailOutreachService
{
    Task SendEmailAsync(Brand brand, OutreachEmail email);
    Task<bool> CheckForReplyAsync(Brand brand, string recipientEmail, DateTimeOffset sentAfter);
    Task<bool> RefreshGmailTokenAsync(Brand brand);
}

public interface IQuotaService
{
    Task<QuotaStatus> GetQuotaStatusAsync(Guid userId);
    Task<bool> CanGeneratePostAsync(Guid userId);
    Task<bool> CanDiscoverLeadAsync(Guid userId);
    Task IncrementPostsUsedAsync(Guid userId, int count = 1);
    Task IncrementLeadsUsedAsync(Guid userId, int count = 1);
    Task ResetQuotaAsync(Guid userId);
    string GetQueueForUser(string planName);
    Task InvalidateQuotaCacheAsync(Guid userId);
}

public interface ISubscriptionService
{
    Task HandleSubscriptionCreatedAsync(string payload);
    Task HandleSubscriptionUpdatedAsync(string payload);
    Task HandlePaymentSuccessAsync(string payload);
    Task HandlePaymentFailedAsync(string payload);
    Task HandleSubscriptionCancelledAsync(string payload);
    Task HandleSubscriptionExpiredAsync(string payload);
    Task<string> GetBillingPortalUrlAsync(Guid userId);
}

public interface ITokenEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}

public interface IGlobalRateLimiter
{
    Task<bool> TryAcquireAsync(string key, int ratePerMinute);
    Task<bool> IsCircuitOpenAsync(string serviceKey);
    Task RecordFailureAsync(string serviceKey);
    Task RecordSuccessAsync(string serviceKey);
}

public interface INotificationService
{
    Task CreateAsync(Notification notification);
    Task<List<Notification>> GetRecentAsync(Guid userId, int count = 10);
    Task MarkAllReadAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
}

public interface IActivityLogService
{
    Task LogAsync(Guid brandId, string type, string description, Dictionary<string, object>? metadata = null);
    Task<List<ActivityLogEntry>> GetByBrandAsync(Guid brandId, int page = 1, int pageSize = 50, string? typeFilter = null);
}

public interface ISuppressionService
{
    Task AddToSuppressionListAsync(Guid brandId, string email, string reason = "unsubscribed");
    Task<bool> IsEmailSuppressedAsync(Guid brandId, string email);
}

public interface ILeadExtractionWorker
{
    Task ExecuteAsync(Guid brandId);
}

public interface ISocialPostingWorker
{
    Task ExecuteAsync(Guid brandId);
}

public interface IOutreachWorker
{
    Task ExecuteAsync();
}

