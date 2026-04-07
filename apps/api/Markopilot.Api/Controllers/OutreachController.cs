using Markopilot.Api.Middleware;
using Markopilot.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OutreachController : ControllerBase
{
    private readonly IOutreachRepository _outreachRepo;
    private readonly ILogger<OutreachController> _logger;

    public OutreachController(IOutreachRepository outreachRepo, ILogger<OutreachController> logger)
    {
        _outreachRepo = outreachRepo;
        _logger = logger;
    }

    [HttpGet("{brandId:guid}/queue")]
    public async Task<IActionResult> GetQueue(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ownerId = HttpContext.GetUserId();
        var result = await _outreachRepo.GetOutreachEmailsByBrandAsync(brandId, ownerId, "queued", page, pageSize);
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpGet("{brandId:guid}/sent")]
    public async Task<IActionResult> GetSent(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ownerId = HttpContext.GetUserId();
        var result = await _outreachRepo.GetOutreachEmailsByBrandAsync(brandId, ownerId, "sent", page, pageSize);
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpGet("{brandId:guid}/{emailId:guid}")]
    public async Task<IActionResult> GetEmail(Guid brandId, Guid emailId)
    {
        var ownerId = HttpContext.GetUserId();
        var email = await _outreachRepo.GetOutreachEmailByIdAsync(brandId, emailId, ownerId);
        
        if (email == null) return NotFound();
        return Ok(email);
    }

    [HttpDelete("{brandId:guid}/{emailId:guid}")]
    public async Task<IActionResult> CancelEmail(Guid brandId, Guid emailId)
    {
        var ownerId = HttpContext.GetUserId();
        await _outreachRepo.CancelOutreachEmailAsync(emailId, ownerId);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("unsubscribe")]
    public async Task<IActionResult> UnsubscribeGet([FromQuery] Guid brandId, [FromQuery] string email)
    {
        if (brandId == Guid.Empty || string.IsNullOrWhiteSpace(email)) return BadRequest("Invalid unsubscription parameters.");
        await _outreachRepo.AddToSuppressionListAsync(brandId, email, "User requested unsubscription via email link.");
        
        // Return a simple HTML message for the browser
        var htmlResponse = "<html><body><h2>You have been successfully unsubscribed.</h2><p>You will no longer receive automated outreach from this brand.</p></body></html>";
        return Content(htmlResponse, "text/html");
    }

    [AllowAnonymous]
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> UnsubscribePost([FromQuery] Guid brandId, [FromQuery] string email)
    {
        if (brandId == Guid.Empty || string.IsNullOrWhiteSpace(email)) return BadRequest("Invalid unsubscription parameters.");
        await _outreachRepo.AddToSuppressionListAsync(brandId, email, "User requested unsubscription via email client.");
        return Ok(new { success = true, message = "Unsubscribed successfully." });
    }
}
