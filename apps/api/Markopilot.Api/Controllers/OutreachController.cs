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
        if (brandId == Guid.Empty || string.IsNullOrWhiteSpace(email)) 
            return Content("<html><body style='font-family: sans-serif; text-align: center; padding: 50px;'><h2>Invalid Unsubscribe Link</h2><p>Missing brand identifier or email address.</p></body></html>", "text/html");

        await _outreachRepo.AddToSuppressionListAsync(brandId, email, "User requested unsubscription via email footer link.");
        
        var htmlResponse = @"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Unsubscribed Successfully</title>
  <style>
    body { background-color: #07070a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background-color: #121217; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .icon { width: 56px; height: 56px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #10b981; font-size: 24px; }
    h1 { font-size: 22px; margin: 0 0 12px; font-weight: 600; letter-spacing: -0.02em; }
    p { color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-size: 12px; color: #e5e7eb; font-family: monospace; }
  </style>
</head>
<body>
  <div class=""card"">
    <div class=""icon"">✓</div>
    <h1>You have been unsubscribed</h1>
    <p>Your email address has been added to this brand's global suppression list. You will not receive any further automated outreach or follow-up communications.</p>
    <div class=""badge"">" + System.Net.WebUtility.HtmlEncode(email) + @"</div>
  </div>
</body>
</html>";
        return Content(htmlResponse, "text/html");
    }

    [AllowAnonymous]
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> UnsubscribePost([FromQuery] Guid brandId, [FromQuery] string email)
    {
        if (brandId == Guid.Empty || string.IsNullOrWhiteSpace(email)) return BadRequest("Invalid unsubscription parameters.");
        await _outreachRepo.AddToSuppressionListAsync(brandId, email, "User requested unsubscription via email client header.");
        return Ok(new { success = true, message = "Unsubscribed successfully." });
    }
}

// ── Request DTOs ─────────────────────────────────
public record ApproveEmailRequest(string? Subject = null, string? BodyText = null, string? BodyHtml = null);
public record BulkApproveRequest(List<Guid> EmailIds);
public record EditDraftRequest(string Subject, string BodyText, string BodyHtml);
