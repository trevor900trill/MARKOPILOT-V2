using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Executors;

public class PostDraftExecutor : IActionExecutor
{
    private readonly ISocialRepository _socialRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly ILogger<PostDraftExecutor> _logger;

    public ActionType ActionType => ActionType.DraftReactivePost;

    public PostDraftExecutor(
        ISocialRepository socialRepo,
        IBrandRepository brandRepo,
        ILogger<PostDraftExecutor> logger)
    {
        _socialRepo = socialRepo;
        _brandRepo = brandRepo;
        _logger = logger;
    }

    public async Task<AgentActionResult> ExecuteAsync(ActionQueueItem action, CancellationToken ct = default)
    {
        try
        {
            var brand = await _brandRepo.GetBrandByIdSystemAsync(action.BrandId);
            if (brand == null)
            {
                return new AgentActionResult { Success = false, Message = "Brand not found." };
            }

            var copy = string.Empty;
            var platform = "Twitter";

            if (!string.IsNullOrWhiteSpace(action.DraftContentJson) && action.DraftContentJson != "{}")
            {
                try
                {
                    using var doc = JsonDocument.Parse(action.DraftContentJson);
                    if (doc.RootElement.TryGetProperty("copy", out var c)) copy = c.GetString() ?? string.Empty;
                    if (doc.RootElement.TryGetProperty("platform", out var p)) platform = p.GetString() ?? "Twitter";
                }
                catch { }
            }

            if (string.IsNullOrWhiteSpace(copy))
            {
                copy = action.Reasoning;
            }

            var post = new SocialPost
            {
                BrandId = brand.Id,
                Platform = platform,
                ContentPillar = "Agent Reactive Growth",
                GeneratedCopy = copy,
                Status = brand.AutomationPostReviewEnabled ? "pending_review" : "queued",
                ScheduledFor = action.ScheduledFor ?? DateTimeOffset.UtcNow.AddMinutes(15),
                GeneratedAt = DateTimeOffset.UtcNow
            };

            var createdPost = await _socialRepo.CreatePostAsync(post);

            _logger.LogInformation("Agent published/queued reactive post {PostId} for brand {BrandName}", createdPost.Id, brand.Name);

            return new AgentActionResult
            {
                Success = true,
                Message = $"Reactive post {createdPost.Id} queued for {platform}.",
                ExternalId = createdPost.Id.ToString(),
                Details = new Dictionary<string, object>
                {
                    ["postId"] = createdPost.Id,
                    ["platform"] = platform,
                    ["status"] = post.Status
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute PostDraftExecutor for action {ActionId}", action.Id);
            return new AgentActionResult { Success = false, Message = ex.Message };
        }
    }
}
