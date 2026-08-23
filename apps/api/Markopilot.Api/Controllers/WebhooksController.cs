using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Markopilot.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

/// <summary>
/// Webhook handlers for Lemon Squeezy and Flutterwave.
/// These endpoints skip JWT auth and use HMAC signature verification instead.
/// Per spec Section 6.1 and 6.2.
/// </summary>
[ApiController]
[Route("api/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly ILogger<WebhooksController> _logger;
    private readonly IConfiguration _config;

    public WebhooksController(ILogger<WebhooksController> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    [HttpPost("lemon-squeezy")]
    public async Task<IActionResult> LemonSqueezy()
    {
        // Read raw body for signature verification
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        // Verify HMAC-SHA256 signature
        var signature = Request.Headers["X-Signature"].FirstOrDefault();
        var secret = _config["LemonSqueezy:WebhookSigningSecret"] ?? "";

        if (string.IsNullOrEmpty(signature) || !VerifyHmacSha256(body, signature, secret))
        {
            _logger.LogWarning("Invalid Lemon Squeezy webhook signature");
            return Unauthorized();
        }

        using var jDoc = JsonDocument.Parse(body);
        var root = jDoc.RootElement;
        
        var eventName = root.GetProperty("meta").GetProperty("event_name").GetString();
        var customData = root.GetProperty("meta").GetProperty("custom_data");
        
        if (customData.TryGetProperty("user_id", out var userIdElem))
        {
            var userIdStr = userIdElem.GetString();
            if (Guid.TryParse(userIdStr, out var userId))
            {
                var repo = HttpContext.RequestServices.GetRequiredService<IUserRepository>();
                
                if (eventName == "subscription_created" || eventName == "subscription_updated")
                {
                    var data = root.GetProperty("data");
                    var attributes = data.GetProperty("attributes");
                    
                    string subscriptionId = data.GetProperty("id").GetString() ?? "";
                    string status = attributes.GetProperty("status").GetString() ?? "unknown";
                    
                    string variantName = "Starter";
                    if (attributes.TryGetProperty("product_name", out var variantNameElem) && variantNameElem.ValueKind != JsonValueKind.Null)
                    {
                        variantName = variantNameElem.GetString() ?? "Starter";
                    }
                    
                    DateTimeOffset? renewsAt = null;
                    if (attributes.TryGetProperty("renews_at", out var renewsAtElem) && renewsAtElem.ValueKind != JsonValueKind.Null)
                    {
                        renewsAt = renewsAtElem.GetDateTimeOffset();
                    }

                    var plan = Markopilot.Core.Models.PlanCatalog.GetByName(variantName);

                    _logger.LogInformation("Processing LS event {EventName} for User {UserId}. Plan: {Plan}, Status: {Status}", eventName, userId, variantName, status);

                    await repo.UpdateUserSubscriptionAsync(
                        userId, 
                        subscriptionId, 
                        status, 
                        plan.Name, 
                        renewsAt, 
                        plan.LeadsPerMonth, 
                        plan.PostsPerMonth, 
                        plan.BrandsAllowed);
                }
                else if (eventName == "subscription_payment_success")
                {
                    _logger.LogInformation("Processing payment success for User {UserId}. Resetting quotas.", userId);
                    await repo.ResetQuotaCountersAsync(userId);
                }
                else if (eventName == "subscription_expired" || eventName == "subscription_cancelled")
                {
                    // Fallback to trialing state
                    var data = root.GetProperty("data");
                    var attributes = data.GetProperty("attributes");
                    string subscriptionId = data.GetProperty("id").GetString() ?? "";
                    string status = attributes.GetProperty("status").GetString() ?? "cancelled";
                    
                    var starterPlan = Markopilot.Core.Models.PlanCatalog.GetByName("Starter");
                    await repo.UpdateUserSubscriptionAsync(
                        userId, 
                        subscriptionId, 
                        status, 
                        starterPlan.Name, 
                        null, 
                        starterPlan.LeadsPerMonth, 
                        starterPlan.PostsPerMonth, 
                        starterPlan.BrandsAllowed);
                }
                
                _logger.LogInformation("Successfully processed webhook for user {UserId}", userId);
            }
        }

        return Ok();
    }

    [HttpPost("flutterwave")]
    public async Task<IActionResult> Flutterwave()
    {
        var hash = Request.Headers["verif-hash"].FirstOrDefault();
        var expectedHash = _config["Flutterwave:WebhookHash"] ?? "";

        if (hash != expectedHash)
        {
            _logger.LogWarning("Invalid Flutterwave webhook hash");
            return Unauthorized();
        }

        // Sprint 2: Process marketplace payment events
        _logger.LogInformation("Received Flutterwave webhook (Sprint 2 — scaffolded)");
        return Ok();
    }

    [HttpPost("mpesa-callback")]
    public async Task<IActionResult> MpesaCallback()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();
        _logger.LogInformation("Received M-PESA Daraja Callback: {Payload}", body);

        try
        {
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("Body", out var bodyElem) ||
                !bodyElem.TryGetProperty("stkCallback", out var callback))
            {
                return Ok(new { ResponseCode = "0", ResponseDesc = "Accepted" });
            }

            var checkoutRequestId = callback.GetProperty("CheckoutRequestID").GetString() ?? "";
            var resultCode = callback.GetProperty("ResultCode").GetInt32();
            var resultDesc = callback.GetProperty("ResultDesc").GetString() ?? "";

            var repo = HttpContext.RequestServices.GetRequiredService<IUserRepository>();
            var tx = await repo.GetMpesaTransactionAsync(checkoutRequestId);

            if (tx == null)
            {
                _logger.LogWarning("M-PESA callback for unknown CheckoutRequestID: {Id}", checkoutRequestId);
                return Ok(new { ResponseCode = "0", ResponseDesc = "Accepted" });
            }

            if (resultCode == 0)
            {
                string? receiptNumber = null;
                if (callback.TryGetProperty("CallbackMetadata", out var meta) &&
                    meta.TryGetProperty("Item", out var items))
                {
                    foreach (var item in items.EnumerateArray())
                    {
                        var name = item.GetProperty("Name").GetString();
                        if (name == "MpesaReceiptNumber" && item.TryGetProperty("Value", out var val))
                        {
                            receiptNumber = val.GetString();
                        }
                    }
                }

                _logger.LogInformation("M-PESA payment success for user {UserId}, receipt {Receipt}", tx.UserId, receiptNumber);

                await repo.UpdateMpesaTransactionStatusAsync(checkoutRequestId, "completed", receiptNumber, resultCode, resultDesc);

                var plan = Markopilot.Core.Models.PlanCatalog.GetByName(tx.PlanName);
                var periodEnd = DateTimeOffset.UtcNow.AddDays(30);

                await repo.UpdateUserSubscriptionAsync(
                    tx.UserId,
                    checkoutRequestId,
                    "active",
                    plan.Name,
                    periodEnd,
                    plan.LeadsPerMonth,
                    plan.PostsPerMonth,
                    plan.BrandsAllowed);

                await repo.ResetQuotaCountersAsync(tx.UserId);

                // 1. Send transactional confirmation email
                var user = await repo.GetUserByIdAsync(tx.UserId);
                var emailService = HttpContext.RequestServices.GetService<IAlertEmailService>();
                if (user != null && emailService != null && !string.IsNullOrEmpty(user.Email))
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await emailService.SendPaymentConfirmationEmailAsync(
                                user.Email,
                                user.DisplayName ?? "Founder",
                                plan.Name,
                                tx.Amount,
                                receiptNumber ?? checkoutRequestId,
                                periodEnd);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to send payment confirmation email for user {UserId}", tx.UserId);
                        }
                    });
                }

                // 2. Insert activity log for user's brands
                var brandRepo = HttpContext.RequestServices.GetService<IBrandRepository>();
                if (brandRepo != null)
                {
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            var brands = await brandRepo.GetBrandsByOwnerAsync(tx.UserId);
                            foreach (var brand in brands)
                            {
                                await brandRepo.InsertActivityAsync(
                                    brand.Id,
                                    "subscription_activated",
                                    $"M-PESA payment confirmed ({receiptNumber ?? checkoutRequestId}). {plan.Name} plan active for 30 days.",
                                    new Dictionary<string, object>
                                    {
                                        ["plan"] = plan.Name,
                                        ["amount"] = tx.Amount,
                                        ["receipt"] = receiptNumber ?? checkoutRequestId
                                    });
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to record activity log for subscription activation for user {UserId}", tx.UserId);
                        }
                    });
                }
            }
            else
            {
                _logger.LogWarning("M-PESA payment failed ({Code}): {Desc}", resultCode, resultDesc);
                await repo.UpdateMpesaTransactionStatusAsync(checkoutRequestId, "failed", null, resultCode, resultDesc);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing M-PESA callback");
        }

        return Ok(new { ResponseCode = "0", ResponseDesc = "Accepted" });
    }

    private static bool VerifyHmacSha256(string payload, string signature, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        using var hmac = new HMACSHA256(keyBytes);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var hash = hmac.ComputeHash(payloadBytes);
        var computed = Convert.ToHexStringLower(hash);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(signature));
    }
}
