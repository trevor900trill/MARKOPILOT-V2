using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Api.Middleware;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly IQuotaService _quotaService;
    private readonly ILeadRepository _leadRepo;
    private readonly IOutreachRepository _outreachRepo;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(
        IBackgroundJobClient backgroundJobs, 
        IQuotaService quotaService, 
        ILeadRepository leadRepo,
        IOutreachRepository outreachRepo,
        ILogger<LeadsController> logger)
    {
        _backgroundJobs = backgroundJobs;
        _quotaService = quotaService;
        _leadRepo = leadRepo;
        _outreachRepo = outreachRepo;
        _logger = logger;
    }

    [HttpGet("{brandId:guid}")]
    public async Task<IActionResult> GetLeads(Guid brandId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? minScore = null,
        [FromQuery] int? maxScore = null)
    {
        var ownerId = HttpContext.GetUserId();
        var result = await _leadRepo.GetLeadsByBrandAsync(brandId, ownerId, page, pageSize, status, minScore, maxScore);
        
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpGet("{brandId:guid}/{leadId:guid}")]
    public async Task<IActionResult> GetLead(Guid brandId, Guid leadId)
    {
        var ownerId = HttpContext.GetUserId();
        var lead = await _leadRepo.GetLeadByIdAsync(brandId, leadId, ownerId);
        
        if (lead == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Lead not found" } });
        return Ok(lead);
    }

    [HttpPost("{brandId:guid}/{leadId:guid}/queue-outreach")]
    public async Task<IActionResult> QueueForOutreach(Guid brandId, Guid leadId)
    {
        var ownerId = HttpContext.GetUserId();
        var lead = await _leadRepo.GetLeadByIdAsync(brandId, leadId, ownerId);
        if (lead == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Lead not found" } });
        
        if (string.IsNullOrWhiteSpace(lead.Email))
        {
            return StatusCode(400, new { error = new { code = "MISSING_EMAIL", message = "Cannot queue outreach for a lead without an email address." } });
        }
        
        var email = new Markopilot.Core.Models.OutreachEmail
        {
            Id = Guid.NewGuid(),
            BrandId = brandId,
            LeadId = leadId,
            RecipientEmail = lead.Email,
            RecipientName = lead.Name,
            Status = "queued",
            GeneratedAt = DateTimeOffset.UtcNow
        };
        await _outreachRepo.CreateOutreachEmailAsync(email);
        return Ok(new { message = "Queued for outreach" });
    }

    [HttpPost("{brandId:guid}/{leadId:guid}/disqualify")]
    public async Task<IActionResult> Disqualify(Guid brandId, Guid leadId)
    {
        await _leadRepo.UpdateLeadStatusAsync(leadId, "disqualified");
        return Ok();
    }

    [HttpDelete("{brandId:guid}/{leadId:guid}")]
    public async Task<IActionResult> DeleteLead(Guid brandId, Guid leadId)
    {
        var ownerId = HttpContext.GetUserId();
        await _leadRepo.DeleteLeadAndOutreachAsync(brandId, leadId, ownerId);
        return NoContent();
    }

    [HttpPost("{brandId:guid}/run-now")]
    public async Task<IActionResult> RunDiscoveryNow(Guid brandId)
    {
        var ownerId = HttpContext.GetUserId();
        if (!await _quotaService.CanDiscoverLeadAsync(ownerId))
        {
            return StatusCode(403, new { error = new { code = "QUOTA_EXCEEDED", message = "Lead discovery limit reached for this month." } });
        }

        _backgroundJobs.Enqueue<ILeadExtractionWorker>(x => x.ExecuteAsync(brandId));
        return Accepted(new { message = "Lead discovery job has been queued." });
    }
}
