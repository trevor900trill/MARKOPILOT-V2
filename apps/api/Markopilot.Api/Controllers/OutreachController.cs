using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OutreachController : ControllerBase
{
    private readonly ILogger<OutreachController> _logger;

    public OutreachController(ILogger<OutreachController> logger)
    {
        _logger = logger;
    }

    [HttpGet("{brandId:guid}/queue")]
    public async Task<IActionResult> GetQueue(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ownerId = Markopilot.Api.Middleware.HttpContextExtensions.GetUserId(HttpContext);
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        var result = await repo.GetOutreachEmailsByBrandAsync(brandId, ownerId, "queued", page, pageSize);
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpGet("{brandId:guid}/sent")]
    public async Task<IActionResult> GetSent(Guid brandId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ownerId = Markopilot.Api.Middleware.HttpContextExtensions.GetUserId(HttpContext);
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        var result = await repo.GetOutreachEmailsByBrandAsync(brandId, ownerId, "sent", page, pageSize);
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpGet("{brandId:guid}/{emailId:guid}")]
    public async Task<IActionResult> GetEmail(Guid brandId, Guid emailId)
    {
        var ownerId = Markopilot.Api.Middleware.HttpContextExtensions.GetUserId(HttpContext);
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        var email = await repo.GetOutreachEmailByIdAsync(brandId, emailId, ownerId);
        
        if (email == null) return NotFound();
        return Ok(email);
    }

    [HttpDelete("{brandId:guid}/{emailId:guid}")]
    public async Task<IActionResult> CancelEmail(Guid brandId, Guid emailId)
    {
        var ownerId = Markopilot.Api.Middleware.HttpContextExtensions.GetUserId(HttpContext);
        var repo = HttpContext.RequestServices.GetRequiredService<Markopilot.Infrastructure.Supabase.SupabaseRepository>();
        await repo.CancelOutreachEmailAsync(emailId, ownerId);
        return NoContent();
    }
}
