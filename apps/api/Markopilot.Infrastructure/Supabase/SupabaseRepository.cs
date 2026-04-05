using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Markopilot.Infrastructure.Supabase;

/// <summary>
/// Typed CRUD operations for all Supabase PostgreSQL tables.
/// Uses Npgsql directly for maximum control over queries.
/// Also implements IUserRepository for Core service access.
/// </summary>
public class SupabaseRepository : IUserRepository
{
    private readonly string _connectionString;
    private readonly ILogger<SupabaseRepository> _logger;

    public SupabaseRepository(string connectionString, ILogger<SupabaseRepository> logger)
    {
        _connectionString = connectionString;
        _logger = logger;
    }

    private NpgsqlConnection CreateConnection() => new(_connectionString);

    // ── USERS ─────────────────────────────────────────

    public async Task<User?> GetUserByIdAsync(Guid id)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT * FROM users WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapUser(reader) : null;
    }

    public async Task<User?> GetUserByGoogleIdAsync(string googleId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT * FROM users WHERE google_id = @googleId", conn);
        cmd.Parameters.AddWithValue("googleId", googleId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapUser(reader) : null;
    }

    public async Task<User> UpsertUserAsync(User user)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO users (id, google_id, email, display_name, photo_url)
            VALUES (@id, @googleId, @email, @displayName, @photoUrl)
            ON CONFLICT (google_id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                photo_url = EXCLUDED.photo_url,
                updated_at = NOW()
            RETURNING *", conn);

        cmd.Parameters.AddWithValue("id", user.Id == Guid.Empty ? Guid.NewGuid() : user.Id);
        cmd.Parameters.AddWithValue("googleId", user.GoogleId);
        cmd.Parameters.AddWithValue("email", user.Email);
        cmd.Parameters.AddWithValue("displayName", (object?)user.DisplayName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("photoUrl", (object?)user.PhotoUrl ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return MapUser(reader);
    }

    public async Task UpdateUserSubscriptionAsync(Guid userId, string subscriptionId, string status,
        string planName, DateTimeOffset? periodEnd, int leadsQuota, int postsQuota, int brandsQuota)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE users SET
                subscription_id = @subId,
                subscription_status = @status,
                plan_name = @plan,
                current_period_end = @periodEnd,
                quota_leads_per_month = @leadsQuota,
                quota_posts_per_month = @postsQuota,
                quota_brands_allowed = @brandsQuota,
                updated_at = NOW()
            WHERE id = @userId", conn);

        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("subId", (object?)subscriptionId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("status", status);
        cmd.Parameters.AddWithValue("plan", planName);
        cmd.Parameters.AddWithValue("periodEnd", (object?)periodEnd ?? DBNull.Value);
        cmd.Parameters.AddWithValue("leadsQuota", leadsQuota);
        cmd.Parameters.AddWithValue("postsQuota", postsQuota);
        cmd.Parameters.AddWithValue("brandsQuota", brandsQuota);

        await cmd.ExecuteNonQueryAsync();
    }

    // ── BRANDS ────────────────────────────────────────

    public async Task<Brand> CreateBrandAsync(Brand brand)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        brand.Id = brand.Id == Guid.Empty ? Guid.NewGuid() : brand.Id;

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO brands (id, owner_id, name, description, website_url, logo_url,
                industry, industry_custom, target_audience_description,
                target_job_titles, target_pain_points, target_geographies,
                brand_voice_formality, brand_voice_humour, brand_voice_assertiveness, brand_voice_empathy,
                content_pillars, business_address)
            VALUES (@id, @ownerId, @name, @desc, @website, @logo,
                @industry, @industryCustom, @audience,
                @jobTitles::jsonb, @painPoints::jsonb, @geos::jsonb,
                @formality, @humour, @assertiveness, @empathy,
                @pillars::jsonb, @address)
            RETURNING *", conn);

        cmd.Parameters.AddWithValue("id", brand.Id);
        cmd.Parameters.AddWithValue("ownerId", brand.OwnerId);
        cmd.Parameters.AddWithValue("name", brand.Name);
        cmd.Parameters.AddWithValue("desc", brand.Description);
        cmd.Parameters.AddWithValue("website", (object?)brand.WebsiteUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("logo", (object?)brand.LogoUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("industry", brand.Industry);
        cmd.Parameters.AddWithValue("industryCustom", (object?)brand.IndustryCustom ?? DBNull.Value);
        cmd.Parameters.AddWithValue("audience", (object?)brand.TargetAudienceDescription ?? DBNull.Value);
        cmd.Parameters.AddWithValue("jobTitles", JsonSerializer.Serialize(brand.TargetJobTitles));
        cmd.Parameters.AddWithValue("painPoints", JsonSerializer.Serialize(brand.TargetPainPoints));
        cmd.Parameters.AddWithValue("geos", JsonSerializer.Serialize(brand.TargetGeographies));
        cmd.Parameters.AddWithValue("formality", brand.BrandVoiceFormality);
        cmd.Parameters.AddWithValue("humour", brand.BrandVoiceHumour);
        cmd.Parameters.AddWithValue("assertiveness", brand.BrandVoiceAssertiveness);
        cmd.Parameters.AddWithValue("empathy", brand.BrandVoiceEmpathy);
        cmd.Parameters.AddWithValue("pillars", JsonSerializer.Serialize(brand.ContentPillars));
        cmd.Parameters.AddWithValue("address", (object?)brand.BusinessAddress ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return MapBrand(reader);
    }

    public async Task<Brand?> GetBrandByIdAsync(Guid brandId, Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT * FROM brands WHERE id = @id AND owner_id = @ownerId", conn);
        cmd.Parameters.AddWithValue("id", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapBrand(reader) : null;
    }

    public async Task<Brand?> GetBrandByIdSystemAsync(Guid brandId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT * FROM brands WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", brandId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapBrand(reader) : null;
    }

    public async Task<Brand> UpdateBrandAsync(Brand brand)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE brands SET
                name = @name,
                description = @desc,
                website_url = @website,
                logo_url = @logo,
                industry = @industry,
                target_audience_description = @audience,
                brand_voice_formality = @formality,
                brand_voice_humour = @humour,
                brand_voice_assertiveness = @assertiveness,
                brand_voice_empathy = @empathy,
                updated_at = NOW()
            WHERE id = @id AND owner_id = @ownerId
            RETURNING *", conn);

        cmd.Parameters.AddWithValue("id", brand.Id);
        cmd.Parameters.AddWithValue("ownerId", brand.OwnerId);
        cmd.Parameters.AddWithValue("name", brand.Name);
        cmd.Parameters.AddWithValue("desc", brand.Description);
        cmd.Parameters.AddWithValue("website", (object?)brand.WebsiteUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("logo", (object?)brand.LogoUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("industry", brand.Industry);
        cmd.Parameters.AddWithValue("audience", (object?)brand.TargetAudienceDescription ?? DBNull.Value);
        cmd.Parameters.AddWithValue("formality", brand.BrandVoiceFormality);
        cmd.Parameters.AddWithValue("humour", brand.BrandVoiceHumour);
        cmd.Parameters.AddWithValue("assertiveness", brand.BrandVoiceAssertiveness);
        cmd.Parameters.AddWithValue("empathy", brand.BrandVoiceEmpathy);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return MapBrand(reader);
    }

    public async Task<List<Brand>> GetBrandsByOwnerAsync(Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT * FROM brands WHERE owner_id = @ownerId AND status != 'archived' ORDER BY created_at DESC", conn);
        cmd.Parameters.AddWithValue("ownerId", ownerId);

        var brands = new List<Brand>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            brands.Add(MapBrand(reader));
        return brands;
    }

    public async Task<int> CountBrandsByOwnerAsync(Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM brands WHERE owner_id = @ownerId AND status != 'archived'", conn);
        cmd.Parameters.AddWithValue("ownerId", ownerId);

        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    // ── POSTS ─────────────────────────────────────────

    public async Task<SocialPost> CreatePostAsync(SocialPost post)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        post.Id = post.Id == Guid.Empty ? Guid.NewGuid() : post.Id;

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO posts (id, brand_id, platform, content_pillar, generated_copy,
                hashtags, media_url, scheduled_for, status)
            VALUES (@id, @brandId, @platform, @pillar, @copy,
                @hashtags::jsonb, @media, @scheduled, @status)
            RETURNING *", conn);

        cmd.Parameters.AddWithValue("id", post.Id);
        cmd.Parameters.AddWithValue("brandId", post.BrandId);
        cmd.Parameters.AddWithValue("platform", post.Platform);
        cmd.Parameters.AddWithValue("pillar", (object?)post.ContentPillar ?? DBNull.Value);
        cmd.Parameters.AddWithValue("copy", post.GeneratedCopy);
        cmd.Parameters.AddWithValue("hashtags", JsonSerializer.Serialize(post.Hashtags));
        cmd.Parameters.AddWithValue("media", (object?)post.MediaUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("scheduled", post.ScheduledFor);
        cmd.Parameters.AddWithValue("status", post.Status);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return MapPost(reader);
    }

    public async Task<List<SocialPost>> GetQueuedPostsAsync(int limit = 50)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT * FROM posts
            WHERE status = 'queued' AND scheduled_for <= NOW()
            ORDER BY scheduled_for ASC
            LIMIT @limit", conn);
        cmd.Parameters.AddWithValue("limit", limit);

        var posts = new List<SocialPost>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            posts.Add(MapPost(reader));
        return posts;
    }

    // ── LEADS ─────────────────────────────────────────

    public async Task BulkInsertLeadsAsync(List<Lead> leads)
    {
        if (leads.Count == 0) return;

        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var batch = new NpgsqlBatch(conn);

        foreach (var lead in leads)
        {
            var cmd = new NpgsqlBatchCommand(@"
                INSERT INTO leads (id, brand_id, discovered_via, source_url, name, job_title,
                    company, email, linkedin_url, twitter_handle, location, ai_summary, lead_score, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT DO NOTHING");

            cmd.Parameters.AddWithValue(lead.Id == Guid.Empty ? Guid.NewGuid() : lead.Id);
            cmd.Parameters.AddWithValue(lead.BrandId);
            cmd.Parameters.AddWithValue((object?)lead.DiscoveredVia ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.SourceUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.Name ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.JobTitle ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.Company ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.LinkedinUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.TwitterHandle ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.Location ?? DBNull.Value);
            cmd.Parameters.AddWithValue((object?)lead.AiSummary ?? DBNull.Value);
            cmd.Parameters.AddWithValue(lead.LeadScore);
            cmd.Parameters.AddWithValue(lead.Status);

            batch.BatchCommands.Add(cmd);
        }

        await batch.ExecuteNonQueryAsync();
        _logger.LogInformation("Bulk inserted {Count} leads", leads.Count);
    }

    public async Task<bool> LeadSourceUrlExistsAsync(Guid brandId, string sourceUrl)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT EXISTS(SELECT 1 FROM leads WHERE brand_id = @brandId AND source_url = @url)", conn);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("url", sourceUrl);

        return (bool)(await cmd.ExecuteScalarAsync())!;
    }

    // ── OUTREACH EMAILS ───────────────────────────────

    public async Task<OutreachEmail> CreateOutreachEmailAsync(OutreachEmail email)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        email.Id = email.Id == Guid.Empty ? Guid.NewGuid() : email.Id;

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO outreach_emails (id, brand_id, lead_id, recipient_email, recipient_name,
                subject, body_text, body_html, status, scheduled_send_at)
            VALUES (@id, @brandId, @leadId, @email, @name, @subject, @bodyText, @bodyHtml, @status, @scheduledAt)
            RETURNING *", conn);

        cmd.Parameters.AddWithValue("id", email.Id);
        cmd.Parameters.AddWithValue("brandId", email.BrandId);
        cmd.Parameters.AddWithValue("leadId", (object?)email.LeadId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("email", email.RecipientEmail);
        cmd.Parameters.AddWithValue("name", (object?)email.RecipientName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("subject", email.Subject);
        cmd.Parameters.AddWithValue("bodyText", email.BodyText);
        cmd.Parameters.AddWithValue("bodyHtml", email.BodyHtml);
        cmd.Parameters.AddWithValue("status", email.Status);
        cmd.Parameters.AddWithValue("scheduledAt", (object?)email.ScheduledSendAt ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return MapOutreachEmail(reader);
    }

    // ── SUPPRESSION LIST ──────────────────────────────

    public async Task AddToSuppressionListAsync(Guid brandId, string email, string reason)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO suppression_list (brand_id, email, reason)
            VALUES (@brandId, @email, @reason)
            ON CONFLICT (brand_id, email) DO NOTHING", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("email", email);
        cmd.Parameters.AddWithValue("reason", reason);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<bool> IsEmailSuppressedAsync(Guid brandId, string email)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT EXISTS(SELECT 1 FROM suppression_list WHERE brand_id = @brandId AND email = @email)", conn);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("email", email);

        return (bool)(await cmd.ExecuteScalarAsync())!;
    }

    // ── ACTIVITY LOG ──────────────────────────────────

    public async Task InsertActivityAsync(Guid brandId, string type, string description,
        Dictionary<string, object>? metadata = null)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO activity_log (brand_id, type, description, metadata)
            VALUES (@brandId, @type, @desc, @meta::jsonb)", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("type", type);
        cmd.Parameters.AddWithValue("desc", description);
        cmd.Parameters.AddWithValue("meta", JsonSerializer.Serialize(metadata ?? new Dictionary<string, object>()));

        await cmd.ExecuteNonQueryAsync();
    }

    // ── NOTIFICATIONS ─────────────────────────────────

    public async Task CreateNotificationAsync(Notification notification)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO notifications (user_id, type, title, message, action_url)
            VALUES (@userId, @type, @title, @message, @actionUrl)", conn);

        cmd.Parameters.AddWithValue("userId", notification.UserId);
        cmd.Parameters.AddWithValue("type", notification.Type);
        cmd.Parameters.AddWithValue("title", notification.Title);
        cmd.Parameters.AddWithValue("message", notification.Message);
        cmd.Parameters.AddWithValue("actionUrl", (object?)notification.ActionUrl ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }

    // ── IUserRepository IMPLEMENTATION ──────────────────

    async Task<User?> IUserRepository.GetUserByIdAsync(Guid userId) =>
        await GetUserByIdAsync(userId);

    public async Task IncrementQuotaPostsUsedAsync(Guid userId, int count = 1)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE users SET quota_posts_used = quota_posts_used + @count, updated_at = NOW()
            WHERE id = @userId", conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("count", count);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task IncrementQuotaLeadsUsedAsync(Guid userId, int count = 1)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE users SET quota_leads_used = quota_leads_used + @count, updated_at = NOW()
            WHERE id = @userId", conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("count", count);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task ResetQuotaCountersAsync(Guid userId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE users SET quota_leads_used = 0, quota_posts_used = 0, updated_at = NOW()
            WHERE id = @userId", conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── POSTS (Extended) ──────────────────────────────

    public async Task UpdatePostStatusAsync(Guid postId, string status,
        string? platformPostId = null, string? errorMessage = null)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE posts SET
                status = @status,
                published_at = CASE WHEN @status = 'published' THEN NOW() ELSE published_at END,
                platform_post_id = COALESCE(@platformPostId, platform_post_id),
                error_message = @errorMessage
            WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", postId);
        cmd.Parameters.AddWithValue("status", status);
        cmd.Parameters.AddWithValue("platformPostId", (object?)platformPostId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("errorMessage", (object?)errorMessage ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<SocialPost>> GetPostsByBrandAsync(Guid brandId, Guid ownerId,
        int page = 1, int pageSize = 20)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT p.* FROM posts p
            JOIN brands b ON b.id = p.brand_id
            WHERE p.brand_id = @brandId AND b.owner_id = @ownerId
            ORDER BY p.scheduled_for DESC
            LIMIT @limit OFFSET @offset", conn);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);
        cmd.Parameters.AddWithValue("limit", pageSize);
        cmd.Parameters.AddWithValue("offset", (page - 1) * pageSize);

        var posts = new List<SocialPost>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            posts.Add(MapPost(reader));
        return posts;
    }

    public async Task CancelPostAsync(Guid postId, Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE posts SET status = 'cancelled'
            WHERE id = @id AND status = 'queued'
            AND brand_id IN (SELECT id FROM brands WHERE owner_id = @ownerId)", conn);
        cmd.Parameters.AddWithValue("id", postId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── SOCIAL TOKENS ─────────────────────────────────

    public async Task<string?> GetBrandSocialTokenAsync(Guid brandId, string platform)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var column = platform.ToLower() switch
        {
            "x" or "twitter" => "twitter_access_token",
            "linkedin" => "linkedin_access_token",
            "instagram" => "instagram_access_token",
            "tiktok" => "tiktok_access_token",
            "gmail" => "gmail_access_token",
            _ => throw new ArgumentException($"Unknown platform: {platform}")
        };

        await using var cmd = new NpgsqlCommand(
            $"SELECT {column} FROM brands WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", brandId);

        var result = await cmd.ExecuteScalarAsync();
        return result as string;
    }

    public async Task UpdateBrandSocialTokenAsync(Guid brandId, string platform,
        string encryptedAccessToken, string? encryptedRefreshToken,
        DateTimeOffset? expiresAt, string? username, bool connected)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var (accessCol, refreshCol, expiresCol, usernameCol, connectedCol) = platform.ToLower() switch
        {
            "x" or "twitter" => ("twitter_access_token", "twitter_refresh_token", "twitter_token_expires_at", "twitter_username", "twitter_connected"),
            "linkedin" => ("linkedin_access_token", "linkedin_refresh_token", "linkedin_token_expires_at", "linkedin_profile_name", "linkedin_connected"),
            "instagram" => ("instagram_access_token", "instagram_access_token", "instagram_access_token", "instagram_username", "instagram_connected"),
            "tiktok" => ("tiktok_access_token", "tiktok_refresh_token", "tiktok_token_expires_at", "tiktok_username", "tiktok_connected"),
            "gmail" => ("gmail_access_token", "gmail_refresh_token", "gmail_token_expires_at", "gmail_email", "gmail_connected"),
            _ => throw new ArgumentException($"Unknown platform: {platform}")
        };

        // Instagram has special columns — no refresh/expires
        string sql;
        if (platform.Equals("instagram", StringComparison.OrdinalIgnoreCase))
        {
            sql = $@"UPDATE brands SET
                instagram_access_token = @accessToken,
                instagram_username = @username,
                instagram_connected = @connected,
                updated_at = NOW()
            WHERE id = @id";
        }
        else
        {
            sql = $@"UPDATE brands SET
                {accessCol} = @accessToken,
                {refreshCol} = @refreshToken,
                {expiresCol} = @expiresAt,
                {usernameCol} = @username,
                {connectedCol} = @connected,
                updated_at = NOW()
            WHERE id = @id";
        }

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", brandId);
        cmd.Parameters.AddWithValue("accessToken", encryptedAccessToken);
        cmd.Parameters.AddWithValue("username", (object?)username ?? DBNull.Value);
        cmd.Parameters.AddWithValue("connected", connected);

        if (!platform.Equals("instagram", StringComparison.OrdinalIgnoreCase))
        {
            cmd.Parameters.AddWithValue("refreshToken", (object?)encryptedRefreshToken ?? DBNull.Value);
            cmd.Parameters.AddWithValue("expiresAt", (object?)expiresAt ?? DBNull.Value);
        }

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DisconnectBrandPlatformAsync(Guid brandId, Guid ownerId, string platform)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var (accessCol, refreshCol, expiresCol, usernameCol, connectedCol) = platform.ToLower() switch
        {
            "x" or "twitter" => ("twitter_access_token", "twitter_refresh_token", "twitter_token_expires_at", "twitter_username", "twitter_connected"),
            "linkedin" => ("linkedin_access_token", "linkedin_refresh_token", "linkedin_token_expires_at", "linkedin_profile_name", "linkedin_connected"),
            "instagram" => ("instagram_access_token", "instagram_account_id", "instagram_access_token", "instagram_username", "instagram_connected"),
            "tiktok" => ("tiktok_access_token", "tiktok_refresh_token", "tiktok_token_expires_at", "tiktok_username", "tiktok_connected"),
            "gmail" => ("gmail_access_token", "gmail_refresh_token", "gmail_token_expires_at", "gmail_email", "gmail_connected"),
            _ => throw new ArgumentException($"Unknown platform: {platform}")
        };

        await using var cmd = new NpgsqlCommand($@"
            UPDATE brands SET
                {accessCol} = NULL,
                {refreshCol} = NULL,
                {connectedCol} = FALSE,
                updated_at = NOW()
            WHERE id = @id AND owner_id = @ownerId", conn);
        cmd.Parameters.AddWithValue("id", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── LEADS (Extended) ──────────────────────────────

    public async Task<(List<Lead> Items, int Total)> GetLeadsByBrandAsync(Guid brandId, Guid ownerId,
        int page = 1, int pageSize = 20, string? status = null, int? minScore = null, int? maxScore = null)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var where = "l.brand_id = @brandId AND b.owner_id = @ownerId";
        if (!string.IsNullOrEmpty(status)) where += " AND l.status = @status";
        if (minScore.HasValue) where += " AND l.lead_score >= @minScore";
        if (maxScore.HasValue) where += " AND l.lead_score <= @maxScore";

        // Count total
        await using var countCmd = new NpgsqlCommand(
            $"SELECT COUNT(*) FROM leads l JOIN brands b ON b.id = l.brand_id WHERE {where}", conn);
        countCmd.Parameters.AddWithValue("brandId", brandId);
        countCmd.Parameters.AddWithValue("ownerId", ownerId);
        if (!string.IsNullOrEmpty(status)) countCmd.Parameters.AddWithValue("status", status);
        if (minScore.HasValue) countCmd.Parameters.AddWithValue("minScore", minScore.Value);
        if (maxScore.HasValue) countCmd.Parameters.AddWithValue("maxScore", maxScore.Value);
        var total = Convert.ToInt32(await countCmd.ExecuteScalarAsync());

        // Fetch page
        await using var cmd = new NpgsqlCommand($@"
            SELECT l.* FROM leads l
            JOIN brands b ON b.id = l.brand_id
            WHERE {where}
            ORDER BY l.discovered_at DESC
            LIMIT @limit OFFSET @offset", conn);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);
        cmd.Parameters.AddWithValue("limit", pageSize);
        cmd.Parameters.AddWithValue("offset", (page - 1) * pageSize);
        if (!string.IsNullOrEmpty(status)) cmd.Parameters.AddWithValue("status", status);
        if (minScore.HasValue) cmd.Parameters.AddWithValue("minScore", minScore.Value);
        if (maxScore.HasValue) cmd.Parameters.AddWithValue("maxScore", maxScore.Value);

        var leads = new List<Lead>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            leads.Add(MapLead(reader));
        return (leads, total);
    }

    public async Task<Lead?> GetLeadByIdAsync(Guid brandId, Guid leadId, Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT l.* FROM leads l
            JOIN brands b ON b.id = l.brand_id
            WHERE l.id = @leadId AND l.brand_id = @brandId AND b.owner_id = @ownerId", conn);
        cmd.Parameters.AddWithValue("leadId", leadId);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapLead(reader) : null;
    }

    public async Task UpdateLeadStatusAsync(Guid leadId, string status)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE leads SET status = @status, updated_at = NOW() WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", leadId);
        cmd.Parameters.AddWithValue("status", status);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteLeadAndOutreachAsync(Guid brandId, Guid leadId, Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        // Verify ownership first
        await using var checkCmd = new NpgsqlCommand(@"
            SELECT EXISTS(SELECT 1 FROM leads l JOIN brands b ON b.id = l.brand_id
            WHERE l.id = @leadId AND l.brand_id = @brandId AND b.owner_id = @ownerId)", conn);
        checkCmd.Parameters.AddWithValue("leadId", leadId);
        checkCmd.Parameters.AddWithValue("brandId", brandId);
        checkCmd.Parameters.AddWithValue("ownerId", ownerId);
        var exists = (bool)(await checkCmd.ExecuteScalarAsync())!;
        if (!exists) throw new KeyNotFoundException("Lead not found.");

        // Delete outreach emails referencing this lead
        await using var delOutreach = new NpgsqlCommand(
            "DELETE FROM outreach_emails WHERE lead_id = @leadId", conn);
        delOutreach.Parameters.AddWithValue("leadId", leadId);
        await delOutreach.ExecuteNonQueryAsync();

        // Delete the lead itself
        await using var delLead = new NpgsqlCommand(
            "DELETE FROM leads WHERE id = @leadId", conn);
        delLead.Parameters.AddWithValue("leadId", leadId);
        await delLead.ExecuteNonQueryAsync();

        _logger.LogInformation("GDPR: Deleted lead {LeadId} and associated outreach.", leadId);
    }

    // ── OUTREACH EMAILS (Extended) ────────────────────

    public async Task<(List<OutreachEmail> Items, int Total)> GetOutreachEmailsByBrandAsync(
        Guid brandId, Guid ownerId, string statusFilter, int page = 1, int pageSize = 20)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var where = "oe.brand_id = @brandId AND b.owner_id = @ownerId AND oe.status = @status";

        await using var countCmd = new NpgsqlCommand(
            $"SELECT COUNT(*) FROM outreach_emails oe JOIN brands b ON b.id = oe.brand_id WHERE {where}", conn);
        countCmd.Parameters.AddWithValue("brandId", brandId);
        countCmd.Parameters.AddWithValue("ownerId", ownerId);
        countCmd.Parameters.AddWithValue("status", statusFilter);
        var total = Convert.ToInt32(await countCmd.ExecuteScalarAsync());

        await using var cmd = new NpgsqlCommand($@"
            SELECT oe.* FROM outreach_emails oe
            JOIN brands b ON b.id = oe.brand_id
            WHERE {where}
            ORDER BY oe.generated_at DESC
            LIMIT @limit OFFSET @offset", conn);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);
        cmd.Parameters.AddWithValue("status", statusFilter);
        cmd.Parameters.AddWithValue("limit", pageSize);
        cmd.Parameters.AddWithValue("offset", (page - 1) * pageSize);

        var emails = new List<OutreachEmail>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            emails.Add(MapOutreachEmail(reader));
        return (emails, total);
    }

    public async Task<OutreachEmail?> GetOutreachEmailByIdAsync(Guid brandId, Guid emailId, Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT oe.* FROM outreach_emails oe
            JOIN brands b ON b.id = oe.brand_id
            WHERE oe.id = @emailId AND oe.brand_id = @brandId AND b.owner_id = @ownerId", conn);
        cmd.Parameters.AddWithValue("emailId", emailId);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapOutreachEmail(reader) : null;
    }

    public async Task UpdateOutreachEmailStatusAsync(Guid emailId, string status,
        string? gmailMessageId = null, string? errorMessage = null)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE outreach_emails SET
                status = @status,
                sent_at = CASE WHEN @status = 'sent' THEN NOW() ELSE sent_at END,
                gmail_message_id = COALESCE(@gmailId, gmail_message_id),
                error_message = @errorMessage
            WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", emailId);
        cmd.Parameters.AddWithValue("status", status);
        cmd.Parameters.AddWithValue("gmailId", (object?)gmailMessageId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("errorMessage", (object?)errorMessage ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task CancelOutreachEmailAsync(Guid emailId, Guid ownerId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE outreach_emails SET status = 'cancelled'
            WHERE id = @id AND status = 'queued'
            AND brand_id IN (SELECT id FROM brands WHERE owner_id = @ownerId)", conn);
        cmd.Parameters.AddWithValue("id", emailId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── ACTIVITY LOG (Extended) ───────────────────────

    public async Task<(List<ActivityLogEntry> Items, int Total)> GetActivityLogAsync(
        Guid brandId, Guid ownerId, int page = 1, int pageSize = 50, string? typeFilter = null)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var where = "a.brand_id = @brandId AND b.owner_id = @ownerId";
        if (!string.IsNullOrEmpty(typeFilter)) where += " AND a.type = @typeFilter";

        await using var countCmd = new NpgsqlCommand(
            $"SELECT COUNT(*) FROM activity_log a JOIN brands b ON b.id = a.brand_id WHERE {where}", conn);
        countCmd.Parameters.AddWithValue("brandId", brandId);
        countCmd.Parameters.AddWithValue("ownerId", ownerId);
        if (!string.IsNullOrEmpty(typeFilter)) countCmd.Parameters.AddWithValue("typeFilter", typeFilter);
        var total = Convert.ToInt32(await countCmd.ExecuteScalarAsync());

        await using var cmd = new NpgsqlCommand($@"
            SELECT a.* FROM activity_log a
            JOIN brands b ON b.id = a.brand_id
            WHERE {where}
            ORDER BY a.created_at DESC
            LIMIT @limit OFFSET @offset", conn);
        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("ownerId", ownerId);
        cmd.Parameters.AddWithValue("limit", pageSize);
        cmd.Parameters.AddWithValue("offset", (page - 1) * pageSize);
        if (!string.IsNullOrEmpty(typeFilter)) cmd.Parameters.AddWithValue("typeFilter", typeFilter);

        var entries = new List<ActivityLogEntry>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            entries.Add(new ActivityLogEntry
            {
                Id = reader.GetGuid(reader.GetOrdinal("id")),
                BrandId = reader.GetGuid(reader.GetOrdinal("brand_id")),
                Type = reader.GetString(reader.GetOrdinal("type")),
                Description = reader.GetString(reader.GetOrdinal("description")),
                CreatedAt = reader.GetFieldValue<DateTimeOffset>(reader.GetOrdinal("created_at")),
            });
        }
        return (entries, total);
    }

    // ── NOTIFICATIONS (Extended) ──────────────────────

    public async Task<List<Notification>> GetNotificationsAsync(Guid userId, int count = 10)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT * FROM notifications WHERE user_id = @userId
            ORDER BY created_at DESC LIMIT @count", conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("count", count);

        var notifications = new List<Notification>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            notifications.Add(new Notification
            {
                Id = reader.GetGuid(reader.GetOrdinal("id")),
                UserId = reader.GetGuid(reader.GetOrdinal("user_id")),
                Type = reader.GetString(reader.GetOrdinal("type")),
                Title = reader.GetString(reader.GetOrdinal("title")),
                Message = reader.GetString(reader.GetOrdinal("message")),
                Read = reader.GetBoolean(reader.GetOrdinal("read")),
                ActionUrl = reader.IsDBNull(reader.GetOrdinal("action_url")) ? null : reader.GetString(reader.GetOrdinal("action_url")),
                CreatedAt = reader.GetFieldValue<DateTimeOffset>(reader.GetOrdinal("created_at")),
            });
        }
        return notifications;
    }

    public async Task MarkNotificationsReadAsync(Guid userId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "UPDATE notifications SET read = TRUE WHERE user_id = @userId AND read = FALSE", conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> GetUnreadNotificationCountAsync(Guid userId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM notifications WHERE user_id = @userId AND read = FALSE", conn);
        cmd.Parameters.AddWithValue("userId", userId);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    // ── MAPPERS ───────────────────────────────────────

    private static User MapUser(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        GoogleId = r.GetString(r.GetOrdinal("google_id")),
        Email = r.GetString(r.GetOrdinal("email")),
        DisplayName = r.IsDBNull(r.GetOrdinal("display_name")) ? null : r.GetString(r.GetOrdinal("display_name")),
        PhotoUrl = r.IsDBNull(r.GetOrdinal("photo_url")) ? null : r.GetString(r.GetOrdinal("photo_url")),
        OnboardingCompleted = r.GetBoolean(r.GetOrdinal("onboarding_completed")),
        SubscriptionStatus = r.GetString(r.GetOrdinal("subscription_status")),
        PlanName = r.GetString(r.GetOrdinal("plan_name")),
        QuotaLeadsPerMonth = r.GetInt32(r.GetOrdinal("quota_leads_per_month")),
        QuotaPostsPerMonth = r.GetInt32(r.GetOrdinal("quota_posts_per_month")),
        QuotaBrandsAllowed = r.GetInt32(r.GetOrdinal("quota_brands_allowed")),
        QuotaLeadsUsed = r.GetInt32(r.GetOrdinal("quota_leads_used")),
        QuotaPostsUsed = r.GetInt32(r.GetOrdinal("quota_posts_used")),
        CreatedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("created_at")),
        UpdatedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("updated_at")),
    };

    private static Brand MapBrand(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        OwnerId = r.GetGuid(r.GetOrdinal("owner_id")),
        Name = r.GetString(r.GetOrdinal("name")),
        Description = r.GetString(r.GetOrdinal("description")),
        Industry = r.GetString(r.GetOrdinal("industry")),
        Status = r.GetString(r.GetOrdinal("status")),
        TwitterConnected = r.GetBoolean(r.GetOrdinal("twitter_connected")),
        LinkedinConnected = r.GetBoolean(r.GetOrdinal("linkedin_connected")),
        InstagramConnected = r.GetBoolean(r.GetOrdinal("instagram_connected")),
        TiktokConnected = r.GetBoolean(r.GetOrdinal("tiktok_connected")),
        GmailConnected = r.GetBoolean(r.GetOrdinal("gmail_connected")),
        AutomationPostsEnabled = r.GetBoolean(r.GetOrdinal("automation_posts_enabled")),
        AutomationLeadsEnabled = r.GetBoolean(r.GetOrdinal("automation_leads_enabled")),
        AutomationOutreachEnabled = r.GetBoolean(r.GetOrdinal("automation_outreach_enabled")),
        CreatedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("created_at")),
        UpdatedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("updated_at")),
    };

    private static SocialPost MapPost(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        BrandId = r.GetGuid(r.GetOrdinal("brand_id")),
        Platform = r.GetString(r.GetOrdinal("platform")),
        ContentPillar = r.IsDBNull(r.GetOrdinal("content_pillar")) ? null : r.GetString(r.GetOrdinal("content_pillar")),
        GeneratedCopy = r.GetString(r.GetOrdinal("generated_copy")),
        Status = r.GetString(r.GetOrdinal("status")),
        ScheduledFor = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("scheduled_for")),
        PublishedAt = r.IsDBNull(r.GetOrdinal("published_at")) ? null : r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("published_at")),
        PlatformPostId = r.IsDBNull(r.GetOrdinal("platform_post_id")) ? null : r.GetString(r.GetOrdinal("platform_post_id")),
        ErrorMessage = r.IsDBNull(r.GetOrdinal("error_message")) ? null : r.GetString(r.GetOrdinal("error_message")),
        GeneratedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("generated_at")),
    };

    private static Lead MapLead(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        BrandId = r.GetGuid(r.GetOrdinal("brand_id")),
        DiscoveredVia = r.IsDBNull(r.GetOrdinal("discovered_via")) ? null : r.GetString(r.GetOrdinal("discovered_via")),
        SourceUrl = r.IsDBNull(r.GetOrdinal("source_url")) ? null : r.GetString(r.GetOrdinal("source_url")),
        Name = r.IsDBNull(r.GetOrdinal("name")) ? null : r.GetString(r.GetOrdinal("name")),
        JobTitle = r.IsDBNull(r.GetOrdinal("job_title")) ? null : r.GetString(r.GetOrdinal("job_title")),
        Company = r.IsDBNull(r.GetOrdinal("company")) ? null : r.GetString(r.GetOrdinal("company")),
        Email = r.IsDBNull(r.GetOrdinal("email")) ? null : r.GetString(r.GetOrdinal("email")),
        LinkedinUrl = r.IsDBNull(r.GetOrdinal("linkedin_url")) ? null : r.GetString(r.GetOrdinal("linkedin_url")),
        TwitterHandle = r.IsDBNull(r.GetOrdinal("twitter_handle")) ? null : r.GetString(r.GetOrdinal("twitter_handle")),
        Location = r.IsDBNull(r.GetOrdinal("location")) ? null : r.GetString(r.GetOrdinal("location")),
        AiSummary = r.IsDBNull(r.GetOrdinal("ai_summary")) ? null : r.GetString(r.GetOrdinal("ai_summary")),
        LeadScore = r.GetInt32(r.GetOrdinal("lead_score")),
        Status = r.GetString(r.GetOrdinal("status")),
        DiscoveredAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("discovered_at")),
        UpdatedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("updated_at")),
    };

    private static OutreachEmail MapOutreachEmail(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        BrandId = r.GetGuid(r.GetOrdinal("brand_id")),
        LeadId = r.IsDBNull(r.GetOrdinal("lead_id")) ? null : r.GetGuid(r.GetOrdinal("lead_id")),
        RecipientEmail = r.GetString(r.GetOrdinal("recipient_email")),
        RecipientName = r.IsDBNull(r.GetOrdinal("recipient_name")) ? null : r.GetString(r.GetOrdinal("recipient_name")),
        Subject = r.GetString(r.GetOrdinal("subject")),
        BodyText = r.GetString(r.GetOrdinal("body_text")),
        BodyHtml = r.GetString(r.GetOrdinal("body_html")),
        Status = r.GetString(r.GetOrdinal("status")),
        GmailMessageId = r.IsDBNull(r.GetOrdinal("gmail_message_id")) ? null : r.GetString(r.GetOrdinal("gmail_message_id")),
        SentAt = r.IsDBNull(r.GetOrdinal("sent_at")) ? null : r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("sent_at")),
        FollowUpScheduled = r.GetBoolean(r.GetOrdinal("follow_up_scheduled")),
        FollowUpSent = r.GetBoolean(r.GetOrdinal("follow_up_sent")),
        ErrorMessage = r.IsDBNull(r.GetOrdinal("error_message")) ? null : r.GetString(r.GetOrdinal("error_message")),
        GeneratedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("generated_at")),
    };
}
