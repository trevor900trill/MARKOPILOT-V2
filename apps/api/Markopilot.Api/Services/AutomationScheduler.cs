using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Api.Services;

/// <summary>
/// Single owner of the Hangfire recurring automation jobs (social post generation + lead extraction).
/// Jobs are created/removed to match the automation flags on the brand, so pausing a brand's
/// automation immediately removes its recurring jobs. Shared by the API controllers so the
/// subscription/payment flow can reschedule jobs when automations are re-enabled.
/// </summary>
public static class AutomationScheduler
{
    public static string PostsJobId(Guid brandId) => $"brand-post-gen-{brandId}";
    public static string LeadsJobId(Guid brandId) => $"brand-leads-gen-{brandId}";

    /// <summary>(Re)create or remove the recurring jobs for a brand based on its automation flags.</summary>
    public static void RescheduleBrand(Brand brand, ILogger? logger = null)
    {
        ScheduleSocialPostingWorker(brand, logger);
        ScheduleLeadExtractionWorker(brand, logger);
    }

    /// <summary>Remove every recurring automation job for a brand (delete, pause, or subscription expiry).</summary>
    public static void RemoveAllJobs(Guid brandId)
    {
        RecurringJob.RemoveIfExists(PostsJobId(brandId));
        RecurringJob.RemoveIfExists(LeadsJobId(brandId));
    }

    private static void ScheduleLeadExtractionWorker(Brand brand, ILogger? logger)
    {
        var jobId = LeadsJobId(brand.Id);
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

            logger?.LogInformation("Scheduled lead extraction job for brand {BrandId} with staggering cron: {Cron}", brand.Id, cron);
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Failed to schedule lead extraction job for brand {BrandId}", brand.Id);
        }
    }

    private static void ScheduleSocialPostingWorker(Brand brand, ILogger? logger)
    {
        var jobId = PostsJobId(brand.Id);
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

            logger?.LogInformation("Scheduled social posting job for brand {BrandId} with cron: {Cron}", brand.Id, cron);
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Failed to schedule social posting job for brand {BrandId}", brand.Id);
        }
    }

    private static (int Hour, int Minute) ParsePostingTime(string? timeUtc)
    {
        if (string.IsNullOrWhiteSpace(timeUtc)) return (8, 0);
        var parts = timeUtc.Split(':');
        return (int.TryParse(parts[0], out var h) ? h : 8, parts.Length > 1 && int.TryParse(parts[1], out var m) ? m : 0);
    }
}