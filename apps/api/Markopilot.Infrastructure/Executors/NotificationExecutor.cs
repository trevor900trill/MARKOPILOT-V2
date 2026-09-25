using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Infrastructure.Executors;

public class NotificationExecutor : IActionExecutor
{
    private readonly INotificationRepository _notificationRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly IAlertEmailService? _alertEmailService;
    private readonly ILogger<NotificationExecutor> _logger;

    public ActionType ActionType => ActionType.NotifyHuman;

    public NotificationExecutor(
        INotificationRepository notificationRepo,
        IBrandRepository brandRepo,
        ILogger<NotificationExecutor> logger,
        IAlertEmailService? alertEmailService = null)
    {
        _notificationRepo = notificationRepo;
        _brandRepo = brandRepo;
        _logger = logger;
        _alertEmailService = alertEmailService;
    }

    public async Task<AgentActionResult> ExecuteAsync(ActionQueueItem action, CancellationToken ct = default)
    {
        try
        {
            var brand = await _brandRepo.GetBrandByIdSystemAsync(action.BrandId);
            if (brand == null) return new AgentActionResult { Success = false, Message = "Brand not found." };

            await _notificationRepo.CreateNotificationAsync(new Notification
            {
                UserId = brand.OwnerId,
                Title = $"⚡ Agent Growth Alert for {brand.Name}",
                Message = action.Reasoning,
                Type = "agent_growth_alert"
            });

            _logger.LogInformation("Agent sent high-priority notification to owner of {BrandName}", brand.Name);

            return new AgentActionResult
            {
                Success = true,
                Message = $"Alert notified to brand owner.",
                Details = new Dictionary<string, object>
                {
                    ["brandName"] = brand.Name,
                    ["reasoning"] = action.Reasoning
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed in NotificationExecutor for action {ActionId}", action.Id);
            return new AgentActionResult { Success = false, Message = ex.Message };
        }
    }
}
