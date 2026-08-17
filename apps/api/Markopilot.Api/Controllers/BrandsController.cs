using Hangfire;
using Markopilot.Api.Middleware;
using Microsoft.AspNetCore.Mvc;
using Markopilot.Core.Interfaces;


namespace Markopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly IBrandRepository _repo;
    private readonly ISocialRepository _socialRepo;
    private readonly IQuotaService _quotaService;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(
        IBrandRepository repo,
        ISocialRepository socialRepo,
        IQuotaService quotaService,
        ILogger<BrandsController> logger)
    {
        _repo = repo;
        _socialRepo = socialRepo;
        _quotaService = quotaService;
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
        
        if (await _quotaService.IsBrandLimitReachedAsync(userId))
        {
            _logger.LogWarning("User {UserId} attempted to create a brand but has reached their plan limit.", userId);
            return StatusCode(403, new { error = new { code = "QUOTA_EXCEEDED", message = "You have reached the maximum number of brands allowed on your plan. Please upgrade to add more." } });
        }

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
        var existing = await _repo.GetBrandByIdAsync(brandId, userId);
        if (existing == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });
        
        brand.Id = brandId;
        brand.OwnerId = userId;
        var updated = await _repo.UpdateBrandAsync(brand);

        ScheduleSocialPostingWorker(updated);
        ScheduleLeadExtractionWorker(updated);

        return Ok(updated);
    }

    [HttpDelete("{brandId:guid}")]
    public async Task<IActionResult> Delete(Guid brandId)
    {
        var userId = HttpContext.GetUserId();
        
        var success = await _repo.DeleteBrandAsync(brandId, userId);
        if (!success) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found or could not be deleted" } });

        RecurringJob.RemoveIfExists($"brand-leads-gen-{brandId}");
        RecurringJob.RemoveIfExists($"brand-post-gen-{brandId}");

        _logger.LogInformation("Brand {BrandId} and its associated automation jobs deleted by user {UserId}", brandId, userId);

        return NoContent();
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

    [HttpGet("{brandId:guid}/calendar")]
    public async Task<IActionResult> GetCalendar(Guid brandId)
    {
        var userId = HttpContext.GetUserId();
        var brand = await _repo.GetBrandByIdAsync(brandId, userId);
        if (brand == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });

        var now = DateTimeOffset.UtcNow;

        // 1. Next Lead Discovery
        DateTimeOffset? nextLeadRun = null;
        var leadMinuteOffset = Math.Abs(brand.Id.GetHashCode() % 60);
        if (brand.AutomationLeadsEnabled)
        {
            var todayTarget = new DateTimeOffset(now.Year, now.Month, now.Day, 2, leadMinuteOffset, 0, TimeSpan.Zero);
            nextLeadRun = now < todayTarget ? todayTarget : todayTarget.AddDays(1);
        }

        // 2. Next Social Post
        DateTimeOffset? nextPostRun = null;
        var (postHour, postMinute) = ParsePostingTime(brand.AutomationPostingTimeUtc);
        if (brand.AutomationPostsEnabled && brand.AutomationPostingDays.Count > 0)
        {
            nextPostRun = CalculateNextPostRun(now, postHour, postMinute, brand.AutomationPostingDays);
        }

        // 3. Next Email Outreach
        DateTimeOffset? nextOutreachRun = null;
        if (brand.AutomationOutreachEnabled)
        {
            var targetHour = (2 + brand.AutomationOutreachDelayHours) % 24;
            var todayOutreach = new DateTimeOffset(now.Year, now.Month, now.Day, targetHour, 0, 0, TimeSpan.Zero);
            nextOutreachRun = now < todayOutreach ? todayOutreach : todayOutreach.AddDays(1);
        }

        // 4. Fetch actual posts from database
        var posts = await _socialRepo.GetPostsByBrandAsync(brandId, userId, 1, 100);

        // 5. Generate 28-day projected schedule items
        var projections = GenerateProjectedSchedule(brand, now, 28);

        return Ok(new
        {
            telemetry = new
            {
                leads = new
                {
                    enabled = brand.AutomationLeadsEnabled,
                    nextRunAt = nextLeadRun,
                    dailyQuota = brand.AutomationLeadsPerDay,
                    scheduleSummary = $"Daily at 02:{leadMinuteOffset:D2} UTC"
                },
                social = new
                {
                    enabled = brand.AutomationPostsEnabled,
                    nextRunAt = nextPostRun,
                    postingDays = brand.AutomationPostingDays,
                    postingTimeUtc = brand.AutomationPostingTimeUtc,
                    postsPerWeek = brand.AutomationPostsPerWeek,
                    scheduleSummary = $"{string.Join(", ", brand.AutomationPostingDays)} at {brand.AutomationPostingTimeUtc} UTC"
                },
                outreach = new
                {
                    enabled = brand.AutomationOutreachEnabled,
                    nextRunAt = nextOutreachRun,
                    dailyLimit = brand.AutomationOutreachDailyLimit,
                    delayHours = brand.AutomationOutreachDelayHours,
                    scheduleSummary = $"Daily (+{brand.AutomationOutreachDelayHours}h delay)"
                }
            },
            actualPosts = posts.Select(p => new
            {
                id = p.Id,
                platform = p.Platform,
                copy = p.GeneratedCopy,
                hashtags = p.Hashtags,
                mediaUrl = p.MediaUrl,
                status = p.Status,
                scheduledFor = p.ScheduledFor,
                publishedAt = p.PublishedAt
            }),
            projectedEvents = projections
        });
    }

    [HttpPost("{brandId:guid}/trigger/{workerType}")]
    public async Task<IActionResult> TriggerWorker(Guid brandId, string workerType)
    {
        var userId = HttpContext.GetUserId();
        var brand = await _repo.GetBrandByIdAsync(brandId, userId);
        if (brand == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });

        switch (workerType.ToLower())
        {
            case "leads":
                BackgroundJob.Enqueue<ILeadExtractionWorker>(w => w.ExecuteAsync(brandId));
                await _repo.InsertActivityAsync(brandId, "worker_triggered", "Lead discovery worker triggered manually.");
                break;
            case "posts":
                BackgroundJob.Enqueue<ISocialPostingWorker>(w => w.ExecuteAsync(brandId));
                await _repo.InsertActivityAsync(brandId, "worker_triggered", "Social post generation worker triggered manually.");
                break;
            case "outreach":
                BackgroundJob.Enqueue<IOutreachWorker>(w => w.ExecuteAsync());
                await _repo.InsertActivityAsync(brandId, "worker_triggered", "Email outreach worker triggered manually.");
                break;
            default:
                return BadRequest(new { error = new { code = "INVALID_WORKER", message = "Supported workers: leads, posts, outreach" } });
        }

        return Ok(new { success = true, message = $"Worker '{workerType}' enqueued.", triggeredAt = DateTimeOffset.UtcNow });
    }

    [HttpGet("{brandId:guid}/activity")]
    public async Task<IActionResult> GetActivity(Guid brandId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? type = null)
    {
        var userId = HttpContext.GetUserId();
        var result = await _repo.GetActivityLogAsync(brandId, userId, page, pageSize, type);
        return Ok(new { data = result.Items, total = result.Total, page, pageSize, totalPages = (int)Math.Ceiling(result.Total / (double)pageSize) });
    }

    [HttpGet("{brandId:guid}/discovery/performance")]
    public async Task<IActionResult> GetDiscoveryPerformance(Guid brandId)
    {
        var userId = HttpContext.GetUserId();
        var brand = await _repo.GetBrandByIdAsync(brandId, userId);
        if (brand == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Brand not found" } });

        var history = await _repo.GetTopPerformingQueriesAsync(brandId, 5);
        return Ok(history);
    }

    private static (int Hour, int Minute) ParsePostingTime(string? timeUtc)
    {
        if (string.IsNullOrWhiteSpace(timeUtc)) return (8, 0);
        var parts = timeUtc.Split(':');
        return (int.TryParse(parts[0], out var h) ? h : 8, parts.Length > 1 && int.TryParse(parts[1], out var m) ? m : 0);
    }

    private static DateTimeOffset CalculateNextPostRun(DateTimeOffset fromUtc, int hour, int minute, List<string> days)
    {
        var dayNames = new HashSet<string>(days.Select(d => d.ToLowerInvariant()));
        for (int i = 0; i < 14; i++)
        {
            var candidate = fromUtc.Date.AddDays(i);
            var candidateDow = candidate.DayOfWeek.ToString().ToLowerInvariant();
            if (dayNames.Contains(candidateDow))
            {
                var candidateTarget = new DateTimeOffset(candidate.Year, candidate.Month, candidate.Day, hour, minute, 0, TimeSpan.Zero);
                if (candidateTarget > fromUtc)
                {
                    return candidateTarget;
                }
            }
        }
        return fromUtc.AddDays(1);
    }

    private static List<object> GenerateProjectedSchedule(Core.Models.Brand brand, DateTimeOffset fromUtc, int daysAhead)
    {
        var list = new List<object>();
        var (postHour, postMinute) = ParsePostingTime(brand.AutomationPostingTimeUtc);
        var postDaysSet = new HashSet<string>(brand.AutomationPostingDays.Select(d => d.ToLowerInvariant()));
        var leadMinute = Math.Abs(brand.Id.GetHashCode() % 60);

        for (int i = 0; i < daysAhead; i++)
        {
            var date = fromUtc.Date.AddDays(i);
            var dow = date.DayOfWeek.ToString().ToLowerInvariant();

            // 1. Projected Lead Discovery (Daily)
            if (brand.AutomationLeadsEnabled)
            {
                var leadTime = new DateTimeOffset(date.Year, date.Month, date.Day, 2, leadMinute, 0, TimeSpan.Zero);
                if (leadTime > fromUtc)
                {
                    list.Add(new
                    {
                        type = "leads",
                        title = $"AI Lead Discovery ({brand.AutomationLeadsPerDay} leads)",
                        scheduledFor = leadTime,
                        status = "projected"
                    });
                }
            }

            // 2. Projected Social Post Generation (On selected posting days)
            if (brand.AutomationPostsEnabled && postDaysSet.Contains(dow))
            {
                var postTime = new DateTimeOffset(date.Year, date.Month, date.Day, postHour, postMinute, 0, TimeSpan.Zero);
                if (postTime > fromUtc)
                {
                    list.Add(new
                    {
                        type = "social",
                        title = $"Social Post Publication",
                        scheduledFor = postTime,
                        status = "projected"
                    });
                }
            }

            // 3. Projected Outreach Dispatch
            if (brand.AutomationOutreachEnabled)
            {
                var outreachHour = (2 + brand.AutomationOutreachDelayHours) % 24;
                var outreachTime = new DateTimeOffset(date.Year, date.Month, date.Day, outreachHour, 0, 0, TimeSpan.Zero);
                if (outreachTime > fromUtc)
                {
                    list.Add(new
                    {
                        type = "outreach",
                        title = $"Email Outreach Dispatch (Up to {brand.AutomationOutreachDailyLimit}/day)",
                        scheduledFor = outreachTime,
                        status = "projected"
                    });
                }
            }
        }

        return list;
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
            var minuteOffset = Math.Abs(brand.Id.GetHashCode() % 60);
            var cron = $"{minuteOffset} 2 * * *";

            RecurringJob.AddOrUpdate<ILeadExtractionWorker>(
                jobId,
                worker => worker.ExecuteAsync(brand.Id),
                cron);
            
            _logger.LogInformation("Scheduled lead extraction job for brand {BrandId} with staggered cron: {Cron}", brand.Id, cron);
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
            var (hour, minute) = ParsePostingTime(brand.AutomationPostingTimeUtc);

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

            RecurringJob.AddOrUpdate<ISocialPostingWorker>(
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
