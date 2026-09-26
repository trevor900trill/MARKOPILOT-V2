using System.Data;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Npgsql;

namespace Markopilot.Infrastructure.Supabase;

public partial class SupabaseRepository : IAgentRepository
{
    // ═══════════════════════════════════════════════════
    // SIGNALS
    // ═══════════════════════════════════════════════════

    public async Task SaveSignalsAsync(List<RawSignal> signals)
    {
        if (signals.Count == 0) return;

        await using var conn = CreateConnection();
        await conn.OpenAsync();

        foreach (var signal in signals)
        {
            await using var cmd = new NpgsqlCommand(@"
                INSERT INTO signals (
                    id, brand_id, source_type, source_name, source_url,
                    title, content, author, author_profile_url, raw_metadata,
                    relevance_score, is_processed, published_at, ingested_at
                ) VALUES (
                    @id, @brandId, @sourceType, @sourceName, @sourceUrl,
                    @title, @content, @author, @authorProfileUrl, @rawMetadata::jsonb,
                    @relevanceScore, @isProcessed, @publishedAt, @ingestedAt
                )
                ON CONFLICT (id) DO NOTHING;", conn);

            cmd.Parameters.AddWithValue("id", signal.Id == Guid.Empty ? Guid.NewGuid() : signal.Id);
            cmd.Parameters.AddWithValue("brandId", signal.BrandId);
            cmd.Parameters.AddWithValue("sourceType", signal.SourceType.ToString());
            cmd.Parameters.AddWithValue("sourceName", (object?)signal.SourceName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("sourceUrl", (object?)signal.SourceUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("title", signal.Title);
            cmd.Parameters.AddWithValue("content", signal.Content);
            cmd.Parameters.AddWithValue("author", (object?)signal.Author ?? DBNull.Value);
            cmd.Parameters.AddWithValue("authorProfileUrl", (object?)signal.AuthorProfileUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("rawMetadata", string.IsNullOrWhiteSpace(signal.RawMetadataJson) ? "{}" : signal.RawMetadataJson);
            cmd.Parameters.AddWithValue("relevanceScore", (object?)signal.RelevanceScore ?? DBNull.Value);
            cmd.Parameters.AddWithValue("isProcessed", signal.IsProcessed);
            cmd.Parameters.AddWithValue("publishedAt", (object?)signal.PublishedAt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("ingestedAt", signal.IngestedAt);

            await cmd.ExecuteNonQueryAsync();
        }
    }

    public async Task<List<RawSignal>> GetUnprocessedSignalsAsync(Guid brandId, int limit = 50)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT * FROM signals
            WHERE brand_id = @brandId AND is_processed = false
            ORDER BY ingested_at DESC
            LIMIT @limit;", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<RawSignal>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapRawSignal(reader));
        }

        return list;
    }

    public async Task MarkSignalProcessedAsync(Guid signalId, double? relevanceScore = null)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE signals SET
                is_processed = true,
                relevance_score = COALESCE(@score, relevance_score)
            WHERE id = @id;", conn);

        cmd.Parameters.AddWithValue("id", signalId);
        cmd.Parameters.AddWithValue("score", (object?)relevanceScore ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }

    // ═══════════════════════════════════════════════════
    // OPPORTUNITIES
    // ═══════════════════════════════════════════════════

    public async Task SaveOpportunityAsync(Opportunity opportunity)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO opportunities (
                id, brand_id, signal_id, category, title, reasoning,
                relevance_score, urgency, status, created_at
            ) VALUES (
                @id, @brandId, @signalId, @category, @title, @reasoning,
                @relevanceScore, @urgency, @status, @createdAt
            )
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                reasoning = EXCLUDED.reasoning,
                relevance_score = EXCLUDED.relevance_score;", conn);

        cmd.Parameters.AddWithValue("id", opportunity.Id == Guid.Empty ? Guid.NewGuid() : opportunity.Id);
        cmd.Parameters.AddWithValue("brandId", opportunity.BrandId);
        cmd.Parameters.AddWithValue("signalId", (object?)opportunity.SignalId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("category", opportunity.Category.ToString());
        cmd.Parameters.AddWithValue("title", opportunity.Title);
        cmd.Parameters.AddWithValue("reasoning", opportunity.Reasoning);
        cmd.Parameters.AddWithValue("relevanceScore", opportunity.RelevanceScore);
        cmd.Parameters.AddWithValue("urgency", opportunity.Urgency.ToString());
        cmd.Parameters.AddWithValue("status", opportunity.Status.ToString());
        cmd.Parameters.AddWithValue("createdAt", opportunity.CreatedAt);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Opportunity>> GetOpportunitiesAsync(Guid brandId, int limit = 50)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT o.*, s.title as signal_title, s.content as signal_content, s.source_url as signal_source_url
            FROM opportunities o
            LEFT JOIN signals s ON o.signal_id = s.id
            WHERE o.brand_id = @brandId
            ORDER BY o.created_at DESC
            LIMIT @limit;", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<Opportunity>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapOpportunity(reader));
        }

        return list;
    }

    public async Task UpdateOpportunityStatusAsync(Guid opportunityId, OpportunityStatus status)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE opportunities SET status = @status WHERE id = @id;", conn);

        cmd.Parameters.AddWithValue("id", opportunityId);
        cmd.Parameters.AddWithValue("status", status.ToString());

        await cmd.ExecuteNonQueryAsync();
    }

    // ═══════════════════════════════════════════════════
    // ACTION QUEUE
    // ═══════════════════════════════════════════════════

    public async Task EnqueueActionsAsync(List<ActionQueueItem> actions)
    {
        if (actions.Count == 0) return;

        await using var conn = CreateConnection();
        await conn.OpenAsync();

        foreach (var action in actions)
        {
            await using var cmd = new NpgsqlCommand(@"
                INSERT INTO action_queue (
                    id, brand_id, opportunity_id, action_type, priority,
                    reasoning, draft_content, target_entity, approval_required,
                    status, scheduled_for, executed_at, result, created_at
                ) VALUES (
                    @id, @brandId, @opportunityId, @actionType, @priority,
                    @reasoning, @draftContent::jsonb, @targetEntity::jsonb, @approvalRequired,
                    @status, @scheduledFor, @executedAt, @result::jsonb, @createdAt
                )
                ON CONFLICT (id) DO NOTHING;", conn);

            cmd.Parameters.AddWithValue("id", action.Id == Guid.Empty ? Guid.NewGuid() : action.Id);
            cmd.Parameters.AddWithValue("brandId", action.BrandId);
            cmd.Parameters.AddWithValue("opportunityId", (object?)action.OpportunityId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("actionType", action.ActionType.ToString());
            cmd.Parameters.AddWithValue("priority", action.Priority);
            cmd.Parameters.AddWithValue("reasoning", action.Reasoning);
            cmd.Parameters.AddWithValue("draftContent", string.IsNullOrWhiteSpace(action.DraftContentJson) ? "{}" : action.DraftContentJson);
            cmd.Parameters.AddWithValue("targetEntity", string.IsNullOrWhiteSpace(action.TargetEntityJson) ? "{}" : action.TargetEntityJson);
            cmd.Parameters.AddWithValue("approvalRequired", action.ApprovalRequired);
            cmd.Parameters.AddWithValue("status", action.Status.ToString());
            cmd.Parameters.AddWithValue("scheduledFor", (object?)action.ScheduledFor ?? DBNull.Value);
            cmd.Parameters.AddWithValue("executedAt", (object?)action.ExecutedAt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("result", string.IsNullOrWhiteSpace(action.ResultJson) ? "{}" : action.ResultJson);
            cmd.Parameters.AddWithValue("createdAt", action.CreatedAt);

            await cmd.ExecuteNonQueryAsync();
        }
    }

    public async Task<List<ActionQueueItem>> GetPendingActionsAsync(Guid? brandId = null, int limit = 50)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var sql = @"
            SELECT a.*, o.title as opp_title, o.category as opp_category
            FROM action_queue a
            LEFT JOIN opportunities o ON a.opportunity_id = o.id
            WHERE a.status = 'Approved' OR (a.status = 'Pending' AND a.approval_required = false)";

        if (brandId.HasValue)
        {
            sql += " AND a.brand_id = @brandId";
        }

        sql += " ORDER BY a.priority ASC, a.created_at ASC LIMIT @limit;";

        await using var cmd = new NpgsqlCommand(sql, conn);
        if (brandId.HasValue)
        {
            cmd.Parameters.AddWithValue("brandId", brandId.Value);
        }
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<ActionQueueItem>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapActionQueueItem(reader));
        }

        return list;
    }

    public async Task<ActionQueueItem?> GetActionByIdAsync(Guid actionId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT a.*, o.title as opp_title, o.category as opp_category
            FROM action_queue a
            LEFT JOIN opportunities o ON a.opportunity_id = o.id
            WHERE a.id = @id;", conn);

        cmd.Parameters.AddWithValue("id", actionId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapActionQueueItem(reader) : null;
    }

    public async Task UpdateActionStatusAsync(Guid actionId, ActionQueueStatus status, string? resultJson = null)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE action_queue SET
                status = @status,
                result = COALESCE(@result::jsonb, result),
                executed_at = CASE WHEN @status = 'Completed' OR @status = 'Failed' THEN NOW() ELSE executed_at END
            WHERE id = @id;", conn);

        cmd.Parameters.AddWithValue("id", actionId);
        cmd.Parameters.AddWithValue("status", status.ToString());
        cmd.Parameters.AddWithValue("result", string.IsNullOrWhiteSpace(resultJson) ? (object)DBNull.Value : resultJson);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<ActionQueueItem>> GetRecentActionsAsync(Guid brandId, int limit = 50)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT a.*, o.title as opp_title, o.category as opp_category
            FROM action_queue a
            LEFT JOIN opportunities o ON a.opportunity_id = o.id
            WHERE a.brand_id = @brandId
            ORDER BY a.created_at DESC
            LIMIT @limit;", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<ActionQueueItem>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapActionQueueItem(reader));
        }

        return list;
    }

    // ═══════════════════════════════════════════════════
    // OUTCOMES
    // ═══════════════════════════════════════════════════

    public async Task SaveOutcomeAsync(AgentOutcome outcome)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO agent_outcomes (
                id, action_id, brand_id, metric_type, metric_value, measured_at, metadata
            ) VALUES (
                @id, @actionId, @brandId, @metricType, @metricValue, @measuredAt, @metadata::jsonb
            );", conn);

        cmd.Parameters.AddWithValue("id", outcome.Id == Guid.Empty ? Guid.NewGuid() : outcome.Id);
        cmd.Parameters.AddWithValue("actionId", outcome.ActionId);
        cmd.Parameters.AddWithValue("brandId", outcome.BrandId);
        cmd.Parameters.AddWithValue("metricType", outcome.MetricType);
        cmd.Parameters.AddWithValue("metricValue", outcome.MetricValue);
        cmd.Parameters.AddWithValue("measuredAt", outcome.MeasuredAt);
        cmd.Parameters.AddWithValue("metadata", string.IsNullOrWhiteSpace(outcome.MetadataJson) ? "{}" : outcome.MetadataJson);

        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<AgentOutcome>> GetOutcomesByBrandAsync(Guid brandId, int limit = 50)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT * FROM agent_outcomes
            WHERE brand_id = @brandId
            ORDER BY measured_at DESC
            LIMIT @limit;", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<AgentOutcome>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new AgentOutcome
            {
                Id = reader.GetGuid(reader.GetOrdinal("id")),
                ActionId = reader.GetGuid(reader.GetOrdinal("action_id")),
                BrandId = reader.GetGuid(reader.GetOrdinal("brand_id")),
                MetricType = reader.GetString(reader.GetOrdinal("metric_type")),
                MetricValue = reader.GetDouble(reader.GetOrdinal("metric_value")),
                MeasuredAt = reader.GetFieldValue<DateTimeOffset>(reader.GetOrdinal("measured_at")),
                MetadataJson = reader.IsDBNull(reader.GetOrdinal("metadata")) ? "{}" : reader.GetString(reader.GetOrdinal("metadata"))
            });
        }

        return list;
    }

    // ═══════════════════════════════════════════════════
    // DASHBOARD METRICS
    // ═══════════════════════════════════════════════════

    public async Task<AgentDashboardMetrics> GetAgentDashboardMetricsAsync(Guid brandId)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        var metrics = new AgentDashboardMetrics();

        // 1. Counts
        await using var cmdCounts = new NpgsqlCommand(@"
            SELECT
                (SELECT COUNT(*) FROM signals WHERE brand_id = @brandId) as signals_count,
                (SELECT COUNT(*) FROM opportunities WHERE brand_id = @brandId) as opps_count,
                (SELECT COUNT(*) FROM action_queue WHERE brand_id = @brandId AND status = 'Completed') as executed_count,
                (SELECT COUNT(*) FROM action_queue WHERE brand_id = @brandId AND status = 'Pending' AND approval_required = true) as pending_count,
                COALESCE((SELECT AVG(relevance_score) FROM opportunities WHERE brand_id = @brandId), 0) as avg_relevance;
        ", conn);
        cmdCounts.Parameters.AddWithValue("brandId", brandId);

        await using (var reader = await cmdCounts.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                metrics.SignalsScannedCount = Convert.ToInt32(reader.GetInt64(0));
                metrics.OpportunitiesFoundCount = Convert.ToInt32(reader.GetInt64(1));
                metrics.ActionsExecutedCount = Convert.ToInt32(reader.GetInt64(2));
                metrics.ActionsPendingApprovalCount = Convert.ToInt32(reader.GetInt64(3));
                metrics.AverageRelevanceScore = Math.Round(reader.GetDouble(4), 1);
            }
        }

        // 2. Recent Opportunities
        metrics.RecentOpportunities = await GetOpportunitiesAsync(brandId, 10);

        // 3. Pending Actions
        metrics.PendingActions = await GetPendingApprovalActionsAsync(brandId, 20);

        // 4. Recent Actions
        metrics.RecentActions = await GetRecentActionsAsync(brandId, 10);

        // 5. Recent Signals
        metrics.RecentSignals = await GetRecentSignalsAsync(brandId, 10);

        return metrics;
    }

    private async Task<List<ActionQueueItem>> GetPendingApprovalActionsAsync(Guid brandId, int limit = 20)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT a.*, o.title as opp_title, o.category as opp_category
            FROM action_queue a
            LEFT JOIN opportunities o ON a.opportunity_id = o.id
            WHERE a.brand_id = @brandId AND a.status = 'Pending' AND a.approval_required = true
            ORDER BY a.priority ASC, a.created_at DESC
            LIMIT @limit;", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<ActionQueueItem>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapActionQueueItem(reader));
        }
        return list;
    }

    public async Task<(List<RawSignal> Items, int TotalCount)> GetSignalsPagedAsync(Guid brandId, int page = 1, int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var countCmd = new NpgsqlCommand("SELECT COUNT(*) FROM signals WHERE brand_id = @brandId", conn);
        countCmd.Parameters.AddWithValue("brandId", brandId);
        var total = Convert.ToInt32(await countCmd.ExecuteScalarAsync() ?? 0);

        var offset = (page - 1) * pageSize;
        await using var cmd = new NpgsqlCommand(@"
            SELECT 
                s.*,
                o.id AS opportunity_id,
                o.title AS opportunity_title,
                o.reasoning AS opportunity_reasoning,
                o.status AS opportunity_status
            FROM signals s
            LEFT JOIN opportunities o ON o.signal_id = s.id
            WHERE s.brand_id = @brandId
            ORDER BY s.ingested_at DESC
            LIMIT @limit OFFSET @offset;", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("limit", pageSize);
        cmd.Parameters.AddWithValue("offset", offset);

        var list = new List<RawSignal>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapRawSignal(reader));
        }

        return (list, total);
    }

    private async Task<List<RawSignal>> GetRecentSignalsAsync(Guid brandId, int limit = 10)
    {
        await using var conn = CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT 
                s.*,
                o.id AS opportunity_id,
                o.title AS opportunity_title,
                o.reasoning AS opportunity_reasoning,
                o.status AS opportunity_status
            FROM signals s
            LEFT JOIN opportunities o ON o.signal_id = s.id
            WHERE s.brand_id = @brandId
            ORDER BY s.ingested_at DESC
            LIMIT @limit;", conn);

        cmd.Parameters.AddWithValue("brandId", brandId);
        cmd.Parameters.AddWithValue("limit", limit);

        var list = new List<RawSignal>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapRawSignal(reader));
        }
        return list;
    }

    // ── MAPPERS ──────────────────────────────────────

    private static RawSignal MapRawSignal(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        BrandId = r.GetGuid(r.GetOrdinal("brand_id")),
        SourceType = Enum.TryParse<SignalSourceType>(r.GetString(r.GetOrdinal("source_type")), true, out var st) ? st : SignalSourceType.WebSearch,
        SourceName = r.IsDBNull(r.GetOrdinal("source_name")) ? null : r.GetString(r.GetOrdinal("source_name")),
        SourceUrl = r.IsDBNull(r.GetOrdinal("source_url")) ? null : r.GetString(r.GetOrdinal("source_url")),
        Title = r.GetString(r.GetOrdinal("title")),
        Content = r.GetString(r.GetOrdinal("content")),
        Author = r.IsDBNull(r.GetOrdinal("author")) ? null : r.GetString(r.GetOrdinal("author")),
        AuthorProfileUrl = r.IsDBNull(r.GetOrdinal("author_profile_url")) ? null : r.GetString(r.GetOrdinal("author_profile_url")),
        RawMetadataJson = r.IsDBNull(r.GetOrdinal("raw_metadata")) ? "{}" : r.GetString(r.GetOrdinal("raw_metadata")),
        RelevanceScore = r.IsDBNull(r.GetOrdinal("relevance_score")) ? null : r.GetDouble(r.GetOrdinal("relevance_score")),
        IsProcessed = r.GetBoolean(r.GetOrdinal("is_processed")),
        PublishedAt = r.IsDBNull(r.GetOrdinal("published_at")) ? null : r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("published_at")),
        IngestedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("ingested_at")),
        OpportunityId = HasColumn(r, "opportunity_id") && !r.IsDBNull(r.GetOrdinal("opportunity_id")) ? r.GetGuid(r.GetOrdinal("opportunity_id")) : null,
        OpportunityTitle = HasColumn(r, "opportunity_title") && !r.IsDBNull(r.GetOrdinal("opportunity_title")) ? r.GetString(r.GetOrdinal("opportunity_title")) : null,
        OpportunityReasoning = HasColumn(r, "opportunity_reasoning") && !r.IsDBNull(r.GetOrdinal("opportunity_reasoning")) ? r.GetString(r.GetOrdinal("opportunity_reasoning")) : null,
        OpportunityStatus = HasColumn(r, "opportunity_status") && !r.IsDBNull(r.GetOrdinal("opportunity_status")) ? r.GetString(r.GetOrdinal("opportunity_status")) : null,
    };

    private static Opportunity MapOpportunity(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        BrandId = r.GetGuid(r.GetOrdinal("brand_id")),
        SignalId = r.IsDBNull(r.GetOrdinal("signal_id")) ? null : r.GetGuid(r.GetOrdinal("signal_id")),
        Category = Enum.TryParse<SignalCategory>(r.GetString(r.GetOrdinal("category")), true, out var c) ? c : SignalCategory.MarketTrend,
        Title = r.GetString(r.GetOrdinal("title")),
        Reasoning = r.GetString(r.GetOrdinal("reasoning")),
        RelevanceScore = r.GetDouble(r.GetOrdinal("relevance_score")),
        Urgency = Enum.TryParse<SignalUrgency>(r.GetString(r.GetOrdinal("urgency")), true, out var u) ? u : SignalUrgency.ActThisWeek,
        Status = Enum.TryParse<OpportunityStatus>(r.GetString(r.GetOrdinal("status")), true, out var s) ? s : OpportunityStatus.Pending,
        CreatedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("created_at")),
        Signal = HasColumn(r, "signal_title") && !r.IsDBNull(r.GetOrdinal("signal_title")) ? new RawSignal
        {
            Title = r.GetString(r.GetOrdinal("signal_title")),
            Content = HasColumn(r, "signal_content") && !r.IsDBNull(r.GetOrdinal("signal_content")) ? r.GetString(r.GetOrdinal("signal_content")) : string.Empty,
            SourceUrl = HasColumn(r, "signal_source_url") && !r.IsDBNull(r.GetOrdinal("signal_source_url")) ? r.GetString(r.GetOrdinal("signal_source_url")) : null
        } : null
    };

    private static ActionQueueItem MapActionQueueItem(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(r.GetOrdinal("id")),
        BrandId = r.GetGuid(r.GetOrdinal("brand_id")),
        OpportunityId = r.IsDBNull(r.GetOrdinal("opportunity_id")) ? null : r.GetGuid(r.GetOrdinal("opportunity_id")),
        ActionType = Enum.TryParse<ActionType>(r.GetString(r.GetOrdinal("action_type")), true, out var at) ? at : ActionType.DraftReactivePost,
        Priority = r.GetInt32(r.GetOrdinal("priority")),
        Reasoning = r.IsDBNull(r.GetOrdinal("reasoning")) ? string.Empty : r.GetString(r.GetOrdinal("reasoning")),
        DraftContentJson = r.IsDBNull(r.GetOrdinal("draft_content")) ? "{}" : r.GetString(r.GetOrdinal("draft_content")),
        TargetEntityJson = r.IsDBNull(r.GetOrdinal("target_entity")) ? "{}" : r.GetString(r.GetOrdinal("target_entity")),
        ApprovalRequired = r.GetBoolean(r.GetOrdinal("approval_required")),
        Status = Enum.TryParse<ActionQueueStatus>(r.GetString(r.GetOrdinal("status")), true, out var s) ? s : ActionQueueStatus.Pending,
        ScheduledFor = r.IsDBNull(r.GetOrdinal("scheduled_for")) ? null : r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("scheduled_for")),
        ExecutedAt = r.IsDBNull(r.GetOrdinal("executed_at")) ? null : r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("executed_at")),
        ResultJson = r.IsDBNull(r.GetOrdinal("result")) ? "{}" : r.GetString(r.GetOrdinal("result")),
        CreatedAt = r.GetFieldValue<DateTimeOffset>(r.GetOrdinal("created_at")),
        Opportunity = HasColumn(r, "opp_title") && !r.IsDBNull(r.GetOrdinal("opp_title")) ? new Opportunity
        {
            Title = r.GetString(r.GetOrdinal("opp_title")),
            Category = HasColumn(r, "opp_category") && !r.IsDBNull(r.GetOrdinal("opp_category")) && Enum.TryParse<SignalCategory>(r.GetString(r.GetOrdinal("opp_category")), true, out var oc) ? oc : SignalCategory.MarketTrend
        } : null
    };
}
