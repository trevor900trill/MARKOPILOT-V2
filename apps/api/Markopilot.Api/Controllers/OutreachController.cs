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

    // ── Review Mode Endpoints ────────────────────────

    [HttpGet("{brandId:guid}/pending")]
    public async Task<IActionResult> GetPendingApproval(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ownerId = HttpContext.GetUserId();
        var result = await _outreachRepo.GetPendingApprovalEmailsAsync(brandId, ownerId, page, pageSize);
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpPut("{brandId:guid}/{emailId:guid}/approve")]
    public async Task<IActionResult> ApproveEmail(Guid brandId, Guid emailId, [FromBody] ApproveEmailRequest? request = null)
    {
        var ownerId = HttpContext.GetUserId();
        await _outreachRepo.ApproveOutreachEmailAsync(emailId, ownerId, request?.Subject, request?.BodyText, request?.BodyHtml);
        return Ok(new { message = "Email approved and queued for sending." });
    }

    [HttpPut("{brandId:guid}/bulk-approve")]
    public async Task<IActionResult> BulkApprove(Guid brandId, [FromBody] BulkApproveRequest request)
    {
        var ownerId = HttpContext.GetUserId();
        await _outreachRepo.BulkApproveOutreachEmailsAsync(request.EmailIds, ownerId);
        return Ok(new { message = $"{request.EmailIds.Count} emails approved and queued for sending." });
    }

    [HttpPut("{brandId:guid}/{emailId:guid}/edit")]
    public async Task<IActionResult> EditDraft(Guid brandId, Guid emailId, [FromBody] EditDraftRequest request)
    {
        var ownerId = HttpContext.GetUserId();
        var email = await _outreachRepo.GetOutreachEmailByIdAsync(brandId, emailId, ownerId);
        if (email == null) return NotFound();
        if (email.Status != "pending_approval")
            return BadRequest(new { error = new { code = "NOT_DRAFT", message = "Only pending approval emails can be edited." } });

        await _outreachRepo.UpdateOutreachEmailContentAsync(emailId, request.Subject, request.BodyText, request.BodyHtml);
        return Ok(new { message = "Draft updated." });
    }

    [HttpDelete("{brandId:guid}/{emailId:guid}/reject")]
    public async Task<IActionResult> RejectEmail(Guid brandId, Guid emailId)
    {
        var ownerId = HttpContext.GetUserId();
        await _outreachRepo.RejectOutreachEmailAsync(emailId, ownerId);
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

// ── Request DTOs ─────────────────────────────────
public record ApproveEmailRequest(string? Subject = null, string? BodyText = null, string? BodyHtml = null);
public record BulkApproveRequest(List<Guid> EmailIds);
public record EditDraftRequest(string Subject, string BodyText, string BodyHtml);
