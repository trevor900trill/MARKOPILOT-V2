using Markopilot.Infrastructure.LemonSqueezy;
using Markopilot.Api.Middleware;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly LemonSqueezyClient _lemonSqueezyClient;
    private readonly ILogger<SubscriptionsController> _logger;

    public SubscriptionsController(LemonSqueezyClient lemonSqueezyClient, ILogger<SubscriptionsController> logger)
    {
        _lemonSqueezyClient = lemonSqueezyClient;
        _logger = logger;
    }

    [HttpGet("checkout")]
    public async Task<IActionResult> GetCheckoutUrl([FromQuery] string planId)
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) throw new UnauthorizedAccessException();
        
        // Example mapping for planId to variant IDs (would typically come from a config or db)
        var variantId = planId == "growth" ? "growth-variant-id" : "scale-variant-id";
        if (planId == "starter") variantId = "starter-variant-id";

        var url = await _lemonSqueezyClient.CreateCheckoutAsync(variantId, "user@example.com", userId.ToString());
        return Ok(new { url });
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        var user = await repo.GetUserByIdAsync(userId);
        
        var quotaService = HttpContext.RequestServices.GetRequiredService<Markopilot.Core.Interfaces.IQuotaService>();
        var quota = await quotaService.GetQuotaStatusAsync(userId);

        return Ok(new { user, quota });
    }

    [HttpPost("billing-portal")]
    public async Task<IActionResult> GetBillingPortalUrl()
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        
        try
        {
            var url = await _lemonSqueezyClient.GetCustomerPortalUrlAsync(userId.ToString());
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get billing portal URL");
            return BadRequest(new { error = "Could not generate billing portal link. Please ensure your subscription is active." });
        }
    }
}
