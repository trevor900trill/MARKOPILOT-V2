using Markopilot.Api.Middleware;
using Markopilot.Api.Services;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Mpesa;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly DarajaMpesaClient _mpesaClient;
    private readonly IUserRepository _userRepo;
    private readonly IQuotaService _quotaService;
    private readonly IAlertEmailService? _alertEmailService;
    private readonly IBrandRepository _brandRepo;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SubscriptionsController> _logger;

    public SubscriptionsController(
        DarajaMpesaClient mpesaClient,
        IUserRepository userRepo,
        IQuotaService quotaService,
        IBrandRepository brandRepo,
        IConfiguration configuration,
        ILogger<SubscriptionsController> logger,
        IAlertEmailService? alertEmailService = null)
    {
        _mpesaClient = mpesaClient;
        _userRepo = userRepo;
        _quotaService = quotaService;
        _brandRepo = brandRepo;
        _configuration = configuration;
        _logger = logger;
        _alertEmailService = alertEmailService;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null) return NotFound();

        var quota = await _quotaService.GetQuotaStatusAsync(userId);
        var plan = PlanCatalog.GetByName(user.PlanName);

        // Check if trial or subscription is active
        var isTrialing = user.SubscriptionStatus == "trialing";
        var trialExpiry = user.TrialEndsAt ?? user.CreatedAt.AddDays(7);
        var isTrialExpired = isTrialing && DateTimeOffset.UtcNow > trialExpiry;
        var isSubscriptionExpired = user.SubscriptionStatus == "active" && user.CurrentPeriodEnd.HasValue && DateTimeOffset.UtcNow > user.CurrentPeriodEnd.Value;

        // Engine state reflects the real automation switches on the user's brands — not the payment record.
        var brands = await _brandRepo.GetBrandsByOwnerAsync(userId);
        var hasEnabledAutomation = brands.Any(b =>
            b.AutomationPostsEnabled || b.AutomationLeadsEnabled || b.AutomationOutreachEnabled);
        var isEnginePaused = brands.Count > 0 && !hasEnabledAutomation;

        return Ok(new
        {
            user,
            quota,
            plan = new
            {
                plan.Name,
                plan.PriceKes,
                plan.PriceUsd,
                plan.LeadsPerMonth,
                plan.PostsPerMonth,
                plan.BrandsAllowed
            },
            isTrialing,
            trialEndsAt = trialExpiry,
            isTrialExpired,
            isSubscriptionExpired,
            isEnginePaused,
            mpesaDetails = new
            {
                tillNumber = _configuration["Mpesa:TillNumber"] ?? "1635990",
                storeNumber = _configuration["Mpesa:StoreNumber"] ?? "1162771",
                msisdn = _configuration["Mpesa:Msisdn"] ?? "0117849456"
            }
        });
    }

    [HttpPost("mpesa/stk-push")]
    public async Task<IActionResult> InitiateMpesaStkPush([FromBody] MpesaStkPushRequest request)
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(new { error = "Please provide a valid M-PESA phone number." });
        }

        var plan = PlanCatalog.GetByName(request.PlanId);
        var amount = plan.PriceKes;

        _logger.LogInformation("Initiating M-PESA STK Push for user {UserId}, plan {Plan}, amount KES {Amount}, phone {Phone}",
            userId, plan.Name, amount, request.PhoneNumber);

        var result = await _mpesaClient.SendStkPushAsync(
            request.PhoneNumber,
            amount,
            $"Markopilot-{plan.Name}",
            $"Markopilot {plan.Name} Plan");

        if (result.Success && !string.IsNullOrEmpty(result.CheckoutRequestId))
        {
            var tx = new MpesaTransaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PlanName = plan.Name,
                Amount = amount,
                PhoneNumber = _mpesaClient.NormalizePhoneNumber(request.PhoneNumber),
                CheckoutRequestId = result.CheckoutRequestId,
                MerchantRequestId = result.MerchantRequestId,
                Status = "pending",
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _userRepo.RecordMpesaTransactionAsync(tx);

            return Ok(new
            {
                success = true,
                checkoutRequestId = result.CheckoutRequestId,
                merchantRequestId = result.MerchantRequestId,
                customerMessage = result.CustomerMessage ?? "STK Push sent. Please check your phone and enter your M-PESA PIN.",
                amountKes = amount,
                planName = plan.Name
            });
        }

        return BadRequest(new { error = result.ResponseDescription ?? "Failed to initiate M-PESA payment prompt." });
    }

    [HttpGet("mpesa/status/{checkoutRequestId}")]
    public async Task<IActionResult> CheckMpesaStatus(string checkoutRequestId)
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var tx = await _userRepo.GetMpesaTransactionAsync(checkoutRequestId);
        if (tx == null) return NotFound(new { error = "Transaction not found." });

        if (tx.Status == "completed")
        {
            return Ok(new { status = "completed", message = "Payment confirmed! Plan is now active." });
        }

        // Query Daraja STK query
        var queryResult = await _mpesaClient.QueryStkPushStatusAsync(checkoutRequestId);

        if (queryResult.IsCompleted)
        {
            var plan = PlanCatalog.GetByName(tx.PlanName);
            var periodEnd = DateTimeOffset.UtcNow.AddDays(30);

            await _userRepo.UpdateMpesaTransactionStatusAsync(checkoutRequestId, "completed", tx.MpesaReceiptNumber, 0, "Success");
            await _userRepo.UpdateUserSubscriptionAsync(
                userId,
                checkoutRequestId,
                "active",
                plan.Name,
                periodEnd,
                plan.LeadsPerMonth,
                plan.PostsPerMonth,
                plan.BrandsAllowed);

            // Reactivate automation on all brands if it was paused
            await ResumeUserAutomationsAsync(userId);

            await _userRepo.ResetQuotaCountersAsync(userId);

            await NotifyPaymentSuccessAsync(userId, plan, tx.Amount, tx.MpesaReceiptNumber ?? checkoutRequestId, periodEnd);

            return Ok(new { status = "completed", message = $"Payment confirmed! You are now subscribed to the {plan.Name} plan." });
        }

        if (queryResult.IsFailed)
        {
            await _userRepo.UpdateMpesaTransactionStatusAsync(checkoutRequestId, "failed", null, queryResult.ResultCode, queryResult.ResultDesc);
            return Ok(new { status = "failed", message = queryResult.ResultDesc ?? "Payment was declined or cancelled." });
        }

        return Ok(new { status = "pending", message = "Awaiting PIN entry on phone..." });
    }

    private async Task ResumeUserAutomationsAsync(Guid userId)
    {
        try
        {
            await _brandRepo.SetUserAutomationEnabledAsync(userId, postsEnabled: true, leadsEnabled: true, outreachEnabled: true);

            var brands = await _brandRepo.GetBrandsByOwnerAsync(userId);
            foreach (var brand in brands)
            {
                AutomationScheduler.RescheduleBrand(brand, _logger);

                await _brandRepo.InsertActivityAsync(
                    brand.Id,
                    "automation_resumed",
                    "Automation resumed: payment confirmed. Autonomous posting, lead discovery, and outreach are live again.",
                    new Dictionary<string, object> { ["source"] = "payment_confirmed" });
            }

            _logger.LogInformation("Resumed automation for {BrandCount} brands owned by user {UserId} after payment confirmation", brands.Count, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resume automations for user {UserId}", userId);
        }
    }

    private async Task NotifyPaymentSuccessAsync(Guid userId, PlanDefinition plan, decimal amount, string receiptNumber, DateTimeOffset periodEnd)
    {
        try
        {
            var user = await _userRepo.GetUserByIdAsync(userId);
            if (user != null && _alertEmailService != null && !string.IsNullOrEmpty(user.Email))
            {
                _ = _alertEmailService.SendPaymentConfirmationEmailAsync(
                    user.Email,
                    user.DisplayName ?? "Founder",
                    plan.Name,
                    amount,
                    receiptNumber,
                    periodEnd);
            }

            var brands = await _brandRepo.GetBrandsByOwnerAsync(userId);
            foreach (var brand in brands)
            {
                await _brandRepo.InsertActivityAsync(
                    brand.Id,
                    "subscription_activated",
                    $"M-PESA payment confirmed ({receiptNumber}). {plan.Name} plan active for 30 days.",
                    new Dictionary<string, object>
                    {
                        ["plan"] = plan.Name,
                        ["amount"] = amount,
                        ["receipt"] = receiptNumber
                    });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dispatching payment notification/activity log for user {UserId}", userId);
        }
    }
}

public record MpesaStkPushRequest(string PlanId, string PhoneNumber);
