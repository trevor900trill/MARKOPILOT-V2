using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly ILogger<PublicController> _logger;

    public PublicController(IUserRepository userRepo, ILogger<PublicController> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("waitlist")]
    public async Task<IActionResult> JoinWaitlist([FromBody] WaitlistRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { error = "Email address is required." });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? request.IpAddress;

        var entry = new CountryWaitlist
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim().ToLowerInvariant(),
            CountryCode = request.CountryCode,
            CountryName = request.CountryName,
            IpAddress = ip,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _userRepo.AddToCountryWaitlistAsync(entry);
        _logger.LogInformation("Added {Email} ({Country}) to international waitlist", entry.Email, entry.CountryName ?? entry.CountryCode);

        return Ok(new { success = true, message = "Thank you! You've been added to our international priority list." });
    }
}

public record WaitlistRequest(string Email, string? CountryCode = null, string? CountryName = null, string? IpAddress = null);
