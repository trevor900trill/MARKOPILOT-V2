using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Supabase;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Hangfire scheduled job that runs the content generation pipeline for a specific brand.
/// Uses IContentGenerationService to create platform-specific content.
/// Per spec Section 10.1.
/// </summary>
public class SocialPostingWorker : ISocialPostingWorker
{
    private readonly IContentGenerationService _contentService;
    private readonly IQuotaService _quotaService;
    private readonly SupabaseRepository _repo;
    private readonly ILogger<SocialPostingWorker> _logger;
    private static readonly Random _random = new Random();

    public SocialPostingWorker(
        IContentGenerationService contentService,
        IQuotaService quotaService,
        SupabaseRepository repo,
        ILogger<SocialPostingWorker> logger)
    {
        _contentService = contentService;
        _quotaService = quotaService;
        _repo = repo;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(Guid brandId)
    {
        _logger.LogInformation("Starting social posting generation for Brand: {BrandId}", brandId);

        var brand = await _repo.GetBrandByIdSystemAsync(brandId);
        if (brand == null)
        {
            _logger.LogWarning("Brand {BrandId} not found.", brandId);
            return;
        }

        if (!brand.AutomationPostsEnabled)
        {
            _logger.LogInformation("Brand {BrandId} has automation posting disabled. Skipping.", brandId);
            return;
        }

        var canGenerate = await _quotaService.CanGeneratePostAsync(brand.OwnerId);
        if (!canGenerate)
        {
            _logger.LogWarning("Brand {BrandId} owner has exceeded their posts quota.", brandId);
            await _repo.InsertActivityAsync(brandId, "quota_warning", "Automated posting paused because post quota is exhausted.");
            // We should also ideally insert a notification
            return;
        }

        var contentPillar = "General Update";
        if (brand.ContentPillars != null && brand.ContentPillars.Count > 0)
        {
            contentPillar = brand.ContentPillars[_random.Next(brand.ContentPillars.Count)];
        }

        var platformsToPost = new List<SocialPlatform>();
        if (brand.TwitterConnected) platformsToPost.Add(SocialPlatform.Twitter);
        if (brand.LinkedinConnected) platformsToPost.Add(SocialPlatform.LinkedIn);
        if (brand.InstagramConnected) platformsToPost.Add(SocialPlatform.Instagram);
        if (brand.TiktokConnected) platformsToPost.Add(SocialPlatform.TikTok);

        if (!platformsToPost.Any())
        {
            _logger.LogInformation("Brand {BrandId} has no connected social platforms. Skipping.", brandId);
            return;
        }

        int successCount = 0;

        foreach (var platform in platformsToPost)
        {
            try
            {
                _logger.LogInformation("Generating post for {Platform} for brand {BrandId}", platform, brandId);
                var generatedPost = await _contentService.GeneratePostAsync(brand, contentPillar, platform);

                var socialPost = new SocialPost
                {
                    Id = Guid.NewGuid(),
                    BrandId = brandId,
                    Platform = platform.ToString().ToLowerInvariant(),
                    ContentPillar = contentPillar,
                    GeneratedCopy = generatedPost.Copy,
                    Hashtags = generatedPost.Hashtags,
                    Status = "queued",
                    ScheduledFor = DateTimeOffset.UtcNow.AddMinutes(_random.Next(0, 31)),
                    GeneratedAt = DateTimeOffset.UtcNow
                };

                await _repo.CreatePostAsync(socialPost);
                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate post for {Platform} for brand {BrandId}", platform, brandId);
                await _repo.InsertActivityAsync(brandId, "error", $"Failed to generate post for {platform}: {ex.Message}");
            }
        }

        if (successCount > 0)
        {
            await _quotaService.IncrementPostsUsedAsync(brand.OwnerId, successCount);
            await _repo.InsertActivityAsync(brandId, "post_generated", $"Successfully queued {successCount} posts for various platforms based on pillar: {contentPillar}.");
        }
    }
}
