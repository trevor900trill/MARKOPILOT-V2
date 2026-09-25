using System.Text.Json;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Executors;

public class ReplyDraftExecutor : IActionExecutor
{
    private readonly INotificationRepository _notificationRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly ILogger<ReplyDraftExecutor> _logger;

    public ActionType ActionType => ActionType.DraftReplyToCreator;

    public ReplyDraftExecutor(
        INotificationRepository notificationRepo,
        IBrandRepository brandRepo,
        ILogger<ReplyDraftExecutor> logger)
    {
        _notificationRepo = notificationRepo;
        _brandRepo = brandRepo;
        _logger = logger;
    }

    public async Task<AgentActionResult> ExecuteAsync(ActionQueueItem action, CancellationToken ct = default)
    {
        try
        {
            var brand = await _brandRepo.GetBrandByIdSystemAsync(action.BrandId);
            if (brand == null) return new AgentActionResult { Success = false, Message = "Brand not found." };

            var copy = string.Empty;
            var targetHandle = string.Empty;
            var targetUrl = string.Empty;

            if (!string.IsNullOrWhiteSpace(action.DraftContentJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(action.DraftContentJson);
                    if (doc.RootElement.TryGetProperty("copy", out var c)) copy = c.GetString() ?? string.Empty;
                }
                catch { }
            }

            if (!string.IsNullOrWhiteSpace(action.TargetEntityJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(action.TargetEntityJson);
                    if (doc.RootElement.TryGetProperty("handle", out var h)) targetHandle = h.GetString() ?? string.Empty;
                    if (doc.RootElement.TryGetProperty("url", out var u)) targetUrl = u.GetString() ?? string.Empty;
                }
                catch { }
            }

            // Create notification for brand owner to review/send the reply
            await _notificationRepo.CreateNotificationAsync(new Notification
            {
                UserId = brand.OwnerId,
                Title = $"💡 Creator reply drafted for {targetHandle}",
                Message = $"Agent drafted a reply: \"{(copy.Length > 100 ? copy[..100] + "..." : copy)}\"",
                Type = "agent_reply_ready"
            });

            _logger.LogInformation("Drafted reply prepared for creator {Handle} (brand {BrandName})", targetHandle, brand.Name);

            return new AgentActionResult
            {
                Success = true,
                Message = $"Reply to {targetHandle} prepared and notified to owner.",
                Details = new Dictionary<string, object>
                {
                    ["handle"] = targetHandle,
                    ["url"] = targetUrl,
                    ["copy"] = copy
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed in ReplyDraftExecutor for action {ActionId}", action.Id);
            return new AgentActionResult { Success = false, Message = ex.Message };
        }
    }
}
