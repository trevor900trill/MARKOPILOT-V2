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
                    
                    await repo.UpdateUserSubscriptionAsync(
                        userId, 
                        subscriptionId, 
                        status, 
                        "Starter", 
                        null, 
                        100, 
                        30, 
                        1);
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
