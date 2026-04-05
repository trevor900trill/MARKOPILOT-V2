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
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(IBackgroundJobClient backgroundJobs, ILogger<LeadsController> logger)
    {
        _backgroundJobs = backgroundJobs;
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
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        var result = await repo.GetLeadsByBrandAsync(brandId, ownerId, page, pageSize, status, minScore, maxScore);
        
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpGet("{brandId:guid}/{leadId:guid}")]
    public async Task<IActionResult> GetLead(Guid brandId, Guid leadId)
    {
        var ownerId = HttpContext.GetUserId();
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        var lead = await repo.GetLeadByIdAsync(brandId, leadId, ownerId);
        
        if (lead == null) return NotFound();
        return Ok(lead);
    }

    [HttpPost("{brandId:guid}/{leadId:guid}/queue-outreach")]
    public async Task<IActionResult> QueueForOutreach(Guid brandId, Guid leadId)
    {
        var ownerId = HttpContext.GetUserId();
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        var lead = await repo.GetLeadByIdAsync(brandId, leadId, ownerId);
        if (lead == null) return NotFound();
        
        var email = new Markopilot.Core.Models.OutreachEmail
        {
            Id = Guid.NewGuid(),
            BrandId = brandId,
            LeadId = leadId,
            Status = "queued",
            GeneratedAt = DateTimeOffset.UtcNow
        };
        await repo.CreateOutreachEmailAsync(email);
        return Ok(new { message = "Queued for outreach" });
    }

    [HttpPost("{brandId:guid}/{leadId:guid}/disqualify")]
    public async Task<IActionResult> Disqualify(Guid brandId, Guid leadId)
    {
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        await repo.UpdateLeadStatusAsync(leadId, "disqualified");
        return Ok();
    }

    [HttpDelete("{brandId:guid}/{leadId:guid}")]
    public async Task<IActionResult> DeleteLead(Guid brandId, Guid leadId)
    {
        var ownerId = HttpContext.GetUserId();
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        await repo.DeleteLeadAndOutreachAsync(brandId, leadId, ownerId);
        return NoContent();
    }

    [HttpPost("{brandId:guid}/run-now")]
    public IActionResult RunDiscoveryNow(Guid brandId)
    {
        _backgroundJobs.Enqueue<ILeadExtractionWorker>(x => x.ExecuteAsync(brandId));
        return Accepted(new { message = "Lead discovery job has been queued." });
    }
}
