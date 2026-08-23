using Markopilot.Api.Middleware;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly ILogger<UsersController> _logger;
    private readonly IConfiguration _configuration;

    public UsersController(IUserRepository userRepo, ILogger<UsersController> logger, IConfiguration configuration)
    {
        _userRepo = userRepo;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = HttpContext.GetUserId();
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "User not found" } });

        var brandsUsed = await _userRepo.CountBrandsByOwnerAsync(userId);
        var plan = Markopilot.Core.Models.PlanCatalog.GetByName(user.PlanName);

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            displayName = user.DisplayName,
            photoUrl = user.PhotoUrl,
            planName = user.PlanName,
            subscriptionStatus = user.SubscriptionStatus,
            onboardingCompleted = user.OnboardingCompleted,
            quotaLeadsPerMonth = plan.LeadsPerMonth,
            quotaPostsPerMonth = plan.PostsPerMonth,
            quotaLeadsUsed = user.QuotaLeadsUsed,
            quotaPostsUsed = user.QuotaPostsUsed,
            quotaBrandsAllowed = plan.BrandsAllowed,
            quotaBrandsUsed = brandsUsed,
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

    [HttpPost("detect-country")]
    public async Task<IActionResult> DetectCountry([FromBody] CountryDetectionRequest request)
    {
        try
        {
            var ipAddress = request.IpAddress ?? HttpContext.Connection.RemoteIpAddress?.ToString();
            
            if (string.IsNullOrEmpty(ipAddress))
            {
                return BadRequest(new { error = "IP address is required" });
            }

            // M-PESA supported countries (ISO 3166-1 alpha-2 codes)
            var mpesaSupportedCountries = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "KE", // Kenya
                "TZ", // Tanzania
                "UG", // Uganda
                "RW", // Rwanda
                "ZW", // Zimbabwe
                "ZA", // South Africa
                "MO", // Mozambique
                "SO", // Somalia
                "ET", // Ethiopia
                "CD", // Democratic Republic of Congo
                "GH", // Ghana
                "CM", // Cameroon
                "CI", // Ivory Coast
                "SN", // Senegal
                "ML", // Mali
                "BF", // Burkina Faso
                "NE", // Niger
            };

            // For development/testing, allow localhost
            if (ipAddress == "127.0.0.1" || ipAddress == "::1" || ipAddress.StartsWith("192.168.") || ipAddress.StartsWith("10."))
            {
                return Ok(new { 
                    countryCode = "KE", // Default to Kenya for local development
                    countryName = "Kenya",
                    isSupported = true,
                    ipAddress = ipAddress
                });
            }

            // Use a free IP geolocation service (ipinfo.io)
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync($"http://ipinfo.io/{ipAddress}/json");
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get country info for IP {IP}", ipAddress);
                return Ok(new { 
                    countryCode = null,
                    countryName = null,
                    isSupported = false,
                    ipAddress = ipAddress
                });
            }

            var content = await response.Content.ReadAsStringAsync();
            var ipInfo = System.Text.Json.JsonDocument.Parse(content);
            
            var countryCode = ipInfo.GetProperty("country").GetString();
            var countryName = ipInfo.TryGetProperty("country", out var countryElement) 
                ? countryElement.GetString() 
                : null;
            
            // ipinfo.io returns country code in 'country' field, not full name
            // We'll use the code for both and can map to full name if needed
            
            isSupported = mpesaSupportedCountries.Contains(countryCode ?? "");

            if (!isSupported && !string.IsNullOrEmpty(countryCode))
            {
                // Automatically add to waitlist if not supported
                var userId = HttpContext.GetUserId();
                if (userId != Guid.Empty)
                {
                    var user = await _userRepo.GetUserByIdAsync(userId);
                    if (user != null)
                    {
                        var waitlistEntry = new CountryWaitlist
                        {
                            Id = Guid.NewGuid(),
                            Email = user.Email,
                            CountryCode = countryCode,
                            CountryName = countryName,
                            IpAddress = ipAddress,
                            CreatedAt = DateTimeOffset.UtcNow
                        };
                        await _userRepo.AddToCountryWaitlistAsync(waitlistEntry);
                        _logger.LogInformation("Added user {UserId} to country waitlist for {Country}", userId, countryCode);
                    }
                }
            }

            return Ok(new { 
                countryCode = countryCode,
                countryName = countryName,
                isSupported = isSupported,
                ipAddress = ipAddress
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting country for IP {IP}", request.IpAddress);
            return StatusCode(500, new { error = new { code = "INTERNAL_ERROR", message = "Failed to detect country" } });
        }
    }
}

public record CountryDetectionRequest(string? IpAddress = null);
