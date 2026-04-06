using Hangfire;
using Markopilot.Api.Middleware;
using Markopilot.Infrastructure.Supabase;
using Microsoft.AspNetCore.Mvc;

namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly SupabaseRepository _repo;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(SupabaseRepository repo, ILogger<BrandsController> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = HttpContext.GetUserId();
        var brands = await _repo.GetBrandsByOwnerAsync(userId);
        return Ok(brands);
    }

    [HttpGet("{brandId:guid}")]
    public async Task<IActionResult> GetById(Guid brandId)
    {
        var userId = HttpContext.GetUserId();
        var brand = await _repo.GetBrandByIdAsync(brandId, userId);
        if (brand == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });
        return Ok(brand);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Core.Models.Brand brand)
    {
        var userId = HttpContext.GetUserId();
        brand.OwnerId = userId;
        
        var created = await _repo.CreateBrandAsync(brand);

        // Immediately schedule workers based on initial settings
        ScheduleSocialPostingWorker(created);
        ScheduleLeadExtractionWorker(created);

        _logger.LogInformation("New brand {BrandId} created and automation initialized by user {UserId}", created.Id, userId);

        return CreatedAtAction(nameof(GetById), new { brandId = created.Id }, created);
    }

    [HttpPut("{brandId:guid}")]
    public async Task<IActionResult> Update(Guid brandId, [FromBody] Core.Models.Brand brand)
    {
        var userId = HttpContext.GetUserId();
        // Assume repo.UpdateBrandAsync exists
        var existing = await _repo.GetBrandByIdAsync(brandId, userId);
        if (existing == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });
        
        brand.Id = brandId;
        brand.OwnerId = userId;
        var updated = await _repo.UpdateBrandAsync(brand);

        ScheduleSocialPostingWorker(updated);
        ScheduleLeadExtractionWorker(updated);

        return Ok(updated);
    }

    [HttpGet("{brandId:guid}/overview")]
    public async Task<IActionResult> GetOverview(Guid brandId)
    {
        var userId = HttpContext.GetUserId();
        var brand = await _repo.GetBrandByIdAsync(brandId, userId);
        if (brand == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });

        var stats = await _repo.GetBrandOverviewStatsAsync(brandId, userId);
        return Ok(stats);
    }

    [HttpGet("{brandId:guid}/activity")]
    public async Task<IActionResult> GetActivity(Guid brandId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? type = null)
    {
        var userId = HttpContext.GetUserId();
        var result = await _repo.GetActivityLogAsync(brandId, userId, page, pageSize, type);
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    private void ScheduleLeadExtractionWorker(Core.Models.Brand brand)
    {
        var jobId = $"brand-leads-gen-{brand.Id}";
        if (!brand.AutomationLeadsEnabled)
        {
            RecurringJob.RemoveIfExists(jobId);
            return;
        }

        try
        {
            // Autonomous discovery runs unconditionally at 02:00 UTC daily for eligible overarching limits
            var cron = "0 2 * * *";

            RecurringJob.AddOrUpdate<Markopilot.Core.Interfaces.ILeadExtractionWorker>(
                jobId,
                worker => worker.ExecuteAsync(brand.Id),
                cron);
            
            _logger.LogInformation("Scheduled lead extraction job for brand {BrandId} with cron: {Cron}", brand.Id, cron);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to schedule lead extraction job for brand {BrandId}", brand.Id);
        }
    }

    private void ScheduleSocialPostingWorker(Core.Models.Brand brand)
    {
        var jobId = $"brand-post-gen-{brand.Id}";
        if (!brand.AutomationPostsEnabled)
        {
            RecurringJob.RemoveIfExists(jobId);
            return;
        }

        try
        {
            var parts = brand.AutomationPostingTimeUtc.Split(':');
            var hour = int.Parse(parts[0]);
            var minute = int.Parse(parts[1]);

            var daysMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                { "sunday", 0 }, { "monday", 1 }, { "tuesday", 2 },
                { "wednesday", 3 }, { "thursday", 4 }, { "friday", 5 }, { "saturday", 6 }
            };

            var selectedDays = brand.AutomationPostingDays
                .Where(d => daysMap.ContainsKey(d))
                .Select(d => daysMap[d])
                .Distinct()
                .OrderBy(d => d)
                .ToList();

            if (!selectedDays.Any())
            {
                RecurringJob.RemoveIfExists(jobId);
                return;
            }

            var daysExpression = string.Join(",", selectedDays);
            var cron = $"{minute} {hour} * * {daysExpression}";

            RecurringJob.AddOrUpdate<Markopilot.Core.Interfaces.ISocialPostingWorker>(
                jobId,
                worker => worker.ExecuteAsync(brand.Id),
                cron);
            
            _logger.LogInformation("Scheduled social posting job for brand {BrandId} with cron: {Cron}", brand.Id, cron);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to schedule social posting job for brand {BrandId}", brand.Id);
        }
    }
}
