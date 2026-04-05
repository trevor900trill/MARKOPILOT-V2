using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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
                var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
                var attributes = root.GetProperty("data").GetProperty("attributes");
                
                string status = attributes.GetProperty("status").GetString() ?? "unknown";
                string variantName = attributes.GetProperty("variant_name").GetString() ?? "";

                // E.g. "subscription_created", "subscription_updated", "subscription_cancelled"
                _logger.LogInformation("Processing Lemon Squeezy event: {EventName} for UserId: {UserId}", eventName, userId);

                await repo.UpdateUserSubscriptionAsync(userId, $"sub_{userId}", status, variantName, null, 100, 30, 1);
                
                if (eventName == "subscription_payment_success")
                {
                    await repo.ResetQuotaCountersAsync(userId);
                }
                
                _logger.LogInformation("Updated user {UserId} to plan {VariantName} status {Status}", userId, variantName, status);
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
