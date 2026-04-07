using Markopilot.Infrastructure.LemonSqueezy;
using Markopilot.Api.Middleware;
using Markopilot.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly LemonSqueezyClient _lemonSqueezyClient;
    private readonly IUserRepository _userRepo;
    private readonly IQuotaService _quotaService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SubscriptionsController> _logger;

    public SubscriptionsController(
        LemonSqueezyClient lemonSqueezyClient,
        IUserRepository userRepo,
        IQuotaService quotaService,
        IConfiguration configuration,
        ILogger<SubscriptionsController> logger)
    {
        _lemonSqueezyClient = lemonSqueezyClient;
        _userRepo = userRepo;
        _quotaService = quotaService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("checkout")]
    public async Task<IActionResult> GetCheckoutUrl([FromQuery] string planId)
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) throw new UnauthorizedAccessException();
        
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "User not found" } });

        // Get variant path from config
        var variantId = _configuration[$"LemonSqueezy:Variants:{planId}"];
        if (string.IsNullOrEmpty(variantId))
        {
            _logger.LogWarning("Plan variant not found for {PlanId}", planId);
            return StatusCode(400, new { error = new { code = "INVALID_PLAN", message = $"Invalid plan: {planId}. Available: Starter, Growth, Scale" } });
        }

        var url = await _lemonSqueezyClient.CreateCheckoutAsync(variantId, user.Email, userId.ToString());
        return Ok(new { url });
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        
        var user = await _userRepo.GetUserByIdAsync(userId);
        var quota = await _quotaService.GetQuotaStatusAsync(userId);

        return Ok(new { user, quota });
    }

    [HttpPost("billing-portal")]
    public async Task<IActionResult> GetBillingPortalUrl()
    {
        var userId = HttpContext.GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        
        try
        {
            var user = await _userRepo.GetUserByIdAsync(userId);
            if (string.IsNullOrEmpty(user?.SubscriptionId)) 
            {
                return BadRequest(new { error = "No active subscription found to manage." });
            }

            var url = await _lemonSqueezyClient.GetSubscriptionPortalUrlAsync(user.SubscriptionId);
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get billing portal URL");
            return BadRequest(new { error = "Could not generate billing portal link. Please ensure your subscription is active." });
        }
    }
}
