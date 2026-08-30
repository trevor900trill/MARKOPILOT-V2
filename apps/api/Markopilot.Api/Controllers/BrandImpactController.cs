using System.Security.Claims;
using Markopilot.Api.Middleware;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/brands/{brandId:guid}/impact")]
[Authorize]
public class BrandImpactController : ControllerBase
{
    private readonly IBrandImpactRepository _impactRepo;
    private readonly IBrandImpactService _impactService;
    private readonly IBrandRepository _brandRepo;
    private readonly IUserRepository _userRepo;
    private readonly ILogger<BrandImpactController> _logger;

    public BrandImpactController(
        IBrandImpactRepository impactRepo,
        IBrandImpactService impactService,
        IBrandRepository brandRepo,
        IUserRepository userRepo,
        ILogger<BrandImpactController> logger)
    {
        _impactRepo = impactRepo;
        _impactService = impactService;
        _brandRepo = brandRepo;
        _userRepo = userRepo;
        _logger = logger;
    }

    private Guid GetUserId()
    {
        return HttpContext.GetUserId();
    }

    private async Task<bool> ValidateBrandOwnershipAsync(Guid brandId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return false;
        var brand = await _brandRepo.GetBrandByIdAsync(brandId, userId);
        return brand != null;
    }

    [HttpGet]
    public async Task<IActionResult> GetBrandImpactEvents(
        Guid brandId,
        [FromQuery] string? status = null,
        [FromQuery] string? impactLevel = null,
        [FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var brand = await _brandRepo.GetBrandByIdAsync(brandId, userId);
        if (brand == null)
        {
            return Forbid();
        }

        var events = await _impactRepo.GetBrandImpactEventsAsync(brandId, status, impactLevel, limit);
        var summary = await _impactRepo.GetBrandImpactSummaryAsync(brandId);

        var owner = await _userRepo.GetUserByIdAsync(brand.OwnerId);
        var plan = PlanCatalog.GetByName(owner?.PlanName);
        summary.ScanFrequency = plan.ImpactFrequencyLabel;

        return Ok(new
        {
            summary,
            events
        });
    }

    [HttpPost("{impactId:guid}/convert-post")]
    public async Task<IActionResult> ConvertImpactToPost(Guid brandId, Guid impactId)
    {
        var userId = GetUserId();
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null || !user.IsSubscriptionActive)
        {
            return StatusCode(403, new { error = new { code = "ENGINE_PAUSED", message = "Brand Impact intelligence is paused because your trial or subscription has expired. Please renew your plan in Account to generate reactive social posts." } });
        }

        if (!await ValidateBrandOwnershipAsync(brandId))
        {
            return Forbid();
        }

        try
        {
            var post = await _impactService.ConvertImpactToSocialPostAsync(brandId, impactId);
            return Ok(new
            {
                message = "Successfully drafted reactive social post from market intelligence.",
                post
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to convert impact {ImpactId} to post for brand {BrandId}", impactId, brandId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{impactId:guid}/dismiss")]
    public async Task<IActionResult> DismissImpact(Guid brandId, Guid impactId)
    {
        if (!await ValidateBrandOwnershipAsync(brandId))
        {
            return Forbid();
        }

        await _impactRepo.UpdateBrandImpactEventStatusAsync(impactId, "dismissed");
        return Ok(new { message = "Impact event dismissed." });
    }

    [HttpPost("scan")]
    public async Task<IActionResult> TriggerOnDemandScan(Guid brandId)
    {
        var userId = GetUserId();
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null || !user.IsSubscriptionActive)
        {
            return StatusCode(403, new { error = new { code = "ENGINE_PAUSED", message = "Brand Impact scans are paused because your trial or subscription has expired. Please renew your plan in Account to run Brand Impact scans." } });
        }

        if (!await ValidateBrandOwnershipAsync(brandId))
        {
            return Forbid();
        }

        try
        {
            var summary = await _impactService.ScanBrandImpactAsync(brandId);
            return Ok(new
            {
                message = "Scan completed successfully.",
                summary
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to run on-demand scan for brand {BrandId}", brandId);
            return BadRequest(new { error = ex.Message });
        }
    }
}
