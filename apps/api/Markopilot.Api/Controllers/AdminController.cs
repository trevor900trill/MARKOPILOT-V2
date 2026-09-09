using Markopilot.Api.Middleware;
using Markopilot.Api.Services;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private const string SuperAdminEmail = "trevormugolawrence@gmail.com";

    private readonly IUserRepository _userRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly IAlertEmailService? _alertEmailService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IUserRepository userRepo,
        IBrandRepository brandRepo,
        INotificationRepository notificationRepo,
        ILogger<AdminController> logger,
        IAlertEmailService? alertEmailService = null)
    {
        _userRepo = userRepo;
        _brandRepo = brandRepo;
        _notificationRepo = notificationRepo;
        _logger = logger;
        _alertEmailService = alertEmailService;
    }

    private async Task<(bool IsAuthorized, User? AdminUser)> ValidateSuperAdminAsync()
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return (false, null);

        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null || !string.Equals(user.Email, SuperAdminEmail, StringComparison.OrdinalIgnoreCase))
        {
            return (false, null);
        }

        return (true, user);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetOnboardedUsers()
    {
        var (isAuthorized, _) = await ValidateSuperAdminAsync();
        if (!isAuthorized)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Access restricted to super administrator." } });
        }

        var users = await _userRepo.GetOnboardedUsersForAdminAsync();
        return Ok(users);
    }

    [HttpGet("manual-payments")]
    public async Task<IActionResult> GetManualPayments([FromQuery] string? status = null)
    {
        var (isAuthorized, _) = await ValidateSuperAdminAsync();
        if (!isAuthorized)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Access restricted to super administrator." } });
        }

        var payments = await _userRepo.GetManualPaymentsAsync(status);
        return Ok(payments);
    }

    [HttpPost("users/{userId}/activate-subscription")]
    public async Task<IActionResult> ActivateSubscription(Guid userId, [FromBody] ActivateSubscriptionRequest? request)
    {
        var (isAuthorized, adminUser) = await ValidateSuperAdminAsync();
        if (!isAuthorized || adminUser == null)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Access restricted to super administrator." } });
        }

        var targetUser = await _userRepo.GetUserByIdAsync(userId);
        if (targetUser == null)
        {
            return NotFound(new { error = new { code = "USER_NOT_FOUND", message = "Target user not found." } });
        }

        var monthsToAdd = request?.MonthsToAdd is > 0 ? request.MonthsToAdd.Value : 1;
        var requestedPlanName = string.IsNullOrWhiteSpace(request?.PlanName) ? targetUser.PlanName : request.PlanName;
        var plan = PlanCatalog.GetByName(requestedPlanName);

        // Calculate new expiration date (extend existing period if in future, else start from now)
        var baseDate = targetUser.CurrentPeriodEnd.HasValue && targetUser.CurrentPeriodEnd.Value > DateTimeOffset.UtcNow
            ? targetUser.CurrentPeriodEnd.Value
            : DateTimeOffset.UtcNow;
        var newPeriodEnd = baseDate.AddDays(30 * monthsToAdd);

        var subId = request?.ManualPaymentId?.ToString() ?? $"admin-manual-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        // 1. Update subscription in DB
        await _userRepo.UpdateUserSubscriptionAsync(
            userId,
            subId,
            "active",
            plan.Name,
            newPeriodEnd,
            plan.LeadsPerMonth,
            plan.PostsPerMonth,
            plan.BrandsAllowed);

        // 2. Reset quotas
        await _userRepo.ResetQuotaCountersAsync(userId);

        // 3. Mark manual payment as approved if specified
        if (request?.ManualPaymentId.HasValue == true)
        {
            await _userRepo.UpdateManualPaymentStatusAsync(
                request.ManualPaymentId.Value,
                "approved",
                adminUser.Email,
                $"Approved and subscription activated for +{monthsToAdd} month(s) by {adminUser.Email}.");
        }

        // 4. Start user engines (posts, leads, outreach)
        await _brandRepo.SetUserAutomationEnabledAsync(userId, postsEnabled: true, leadsEnabled: true, outreachEnabled: true);
        var brands = await _brandRepo.GetBrandsByOwnerAsync(userId);
        foreach (var brand in brands)
        {
            AutomationScheduler.RescheduleBrand(brand, _logger);

            await _brandRepo.InsertActivityAsync(
                brand.Id,
                "subscription_activated",
                $"Subscription renewed ({plan.Name} plan) until {newPeriodEnd:MMM dd, yyyy}. Autonomous engine started.",
                new Dictionary<string, object>
                {
                    ["plan"] = plan.Name,
                    ["periodEnd"] = newPeriodEnd.ToString("o"),
                    ["activatedBy"] = adminUser.Email
                });

            await _brandRepo.InsertActivityAsync(
                brand.Id,
                "automation_resumed",
                "Automation engine resumed: scheduled social posting, lead extraction, and outreach are active.",
                new Dictionary<string, object> { ["source"] = "admin_activation" });
        }

        // 5. Create in-app notification
        await _notificationRepo.CreateNotificationAsync(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = "subscription_activated",
            Title = "🚀 Growth Engine Activated!",
            Message = $"Your Markopilot {plan.Name} subscription is active until {newPeriodEnd:MMM dd, yyyy}. Your autonomous engines have resumed full operations.",
            ActionUrl = "/dashboard",
            CreatedAt = DateTimeOffset.UtcNow
        });

        // 6. Send transactional email
        if (_alertEmailService != null && !string.IsNullOrEmpty(targetUser.Email))
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    var receipt = request?.TransactionCode ?? (request?.ManualPaymentId?.ToString() ?? "M-PESA-VERIFIED");
                    await _alertEmailService.SendPaymentConfirmationEmailAsync(
                        targetUser.Email,
                        targetUser.DisplayName ?? "Founder",
                        plan.Name,
                        plan.PriceKes * monthsToAdd,
                        receipt,
                        newPeriodEnd);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send subscription renewal email for user {UserId}", userId);
                }
            });
        }

        _logger.LogInformation(
            "Admin {AdminEmail} activated subscription for user {UserId} ({Email}) on plan {Plan} until {PeriodEnd}. Engine restarted.",
            adminUser.Email, userId, targetUser.Email, plan.Name, newPeriodEnd);

        return Ok(new
        {
            success = true,
            userId = targetUser.Id,
            planName = plan.Name,
            currentPeriodEnd = newPeriodEnd,
            brandsCount = brands.Count,
            isEngineActive = true,
            message = $"Subscription activated for {targetUser.Email}! Engines restarted, notification created, and confirmation email dispatched."
        });
    }

    [HttpPost("manual-payments/{id}/approve")]
    public async Task<IActionResult> ApproveManualPayment(Guid id)
    {
        var (isAuthorized, adminUser) = await ValidateSuperAdminAsync();
        if (!isAuthorized || adminUser == null)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Access restricted to super administrator." } });
        }

        var payment = await _userRepo.GetManualPaymentByIdAsync(id);
        if (payment == null)
        {
            return NotFound(new { error = new { code = "NOT_FOUND", message = "Payment submission not found." } });
        }

        return await ActivateSubscription(payment.UserId, new ActivateSubscriptionRequest
        {
            PlanName = payment.PlanName,
            MonthsToAdd = 1,
            ManualPaymentId = payment.Id,
            TransactionCode = payment.TransactionCode
        });
    }

    [HttpPost("manual-payments/{id}/reject")]
    public async Task<IActionResult> RejectManualPayment(Guid id, [FromBody] RejectPaymentRequest? request)
    {
        var (isAuthorized, adminUser) = await ValidateSuperAdminAsync();
        if (!isAuthorized || adminUser == null)
        {
            return StatusCode(403, new { error = new { code = "FORBIDDEN", message = "Access restricted to super administrator." } });
        }

        var payment = await _userRepo.GetManualPaymentByIdAsync(id);
        if (payment == null)
        {
            return NotFound(new { error = new { code = "NOT_FOUND", message = "Payment submission not found." } });
        }

        await _userRepo.UpdateManualPaymentStatusAsync(
            id,
            "rejected",
            adminUser.Email,
            request?.Notes ?? "Payment verification was unsuccessful. Please check your transaction details and resubmit.");

        _logger.LogInformation("Admin {AdminEmail} rejected manual payment {PaymentId} for user {UserId}",
            adminUser.Email, id, payment.UserId);

        return Ok(new
        {
            success = true,
            paymentId = id,
            status = "rejected",
            message = "Payment submission marked as rejected."
        });
    }
}

public class ActivateSubscriptionRequest
{
    public string? PlanName { get; set; }
    public int? MonthsToAdd { get; set; } = 1;
    public Guid? ManualPaymentId { get; set; }
    public string? TransactionCode { get; set; }
}

public class RejectPaymentRequest
{
    public string? Notes { get; set; }
}
