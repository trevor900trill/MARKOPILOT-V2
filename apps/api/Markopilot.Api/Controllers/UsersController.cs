using Markopilot.Api.Middleware;
using Markopilot.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserRepository userRepo, ILogger<UsersController> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = HttpContext.GetUserId();
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "User not found" } });

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            displayName = user.DisplayName,
            photoUrl = user.PhotoUrl,
            planName = user.PlanName,
            subscriptionStatus = user.SubscriptionStatus,
            onboardingCompleted = user.OnboardingCompleted,
            quotaLeadsPerMonth = user.QuotaLeadsPerMonth,
            quotaPostsPerMonth = user.QuotaPostsPerMonth,
            quotaLeadsUsed = user.QuotaLeadsUsed,
            quotaPostsUsed = user.QuotaPostsUsed,
            quotaBrandsAllowed = user.QuotaBrandsAllowed,
            createdAt = user.CreatedAt,
        });
    }

    [HttpPatch("onboarding-complete")]
    public async Task<IActionResult> CompleteOnboarding()
    {
        var userId = HttpContext.GetUserId();
        
        try
        {
            await _userRepo.UpdateOnboardingStatusAsync(userId, true);
            _logger.LogInformation("User {UserId} marked onboarding as complete", userId);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark onboarding as complete for user {UserId}", userId);
            return StatusCode(500, new { error = new { code = "INTERNAL_ERROR", message = "Failed to update onboarding status" } });
        }
    }
}
