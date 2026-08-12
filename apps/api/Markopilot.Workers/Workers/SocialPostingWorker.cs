using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Hangfire scheduled job that runs the content generation pipeline for a specific brand.
/// Uses IContentGenerationService to create platform-specific content.
/// For Instagram/TikTok, also generates media (image/video) via IMediaGenerationService.
/// Per spec Section 10.1.
/// </summary>
public class SocialPostingWorker : ISocialPostingWorker
{
    private readonly IContentGenerationService _contentService;
    private readonly IMediaGenerationService _mediaService;
    private readonly IQuotaService _quotaService;
    private readonly ISocialRepository _socialRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly ILogger<SocialPostingWorker> _logger;
    private static readonly Random _random = new Random();

    public SocialPostingWorker(
        IContentGenerationService contentService,
        IMediaGenerationService mediaService,
        IQuotaService quotaService,
        ISocialRepository socialRepo,
        IBrandRepository brandRepo,
        ILogger<SocialPostingWorker> logger)
    {
        _contentService = contentService;
        _mediaService = mediaService;
        _quotaService = quotaService;
        _socialRepo = socialRepo;
        _brandRepo = brandRepo;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(Guid brandId)
    {
        _logger.LogInformation("Starting social posting generation for Brand: {BrandId}", brandId);

        var brand = await _brandRepo.GetBrandByIdSystemAsync(brandId);
        if (brand == null)
        {
            _logger.LogWarning("Brand {BrandId} not found. Removing recurring job.", brandId);
            RecurringJob.RemoveIfExists($"brand-post-gen-{brandId}");
            return;
        }

        if (!brand.AutomationPostsEnabled)
        {
            _logger.LogInformation("Brand {BrandId} has automation posting disabled. Removing recurring job.", brandId);
            RecurringJob.RemoveIfExists($"brand-post-gen-{brandId}");
            return;
        }

        var canGenerate = await _quotaService.CanGeneratePostAsync(brand.OwnerId);
        if (!canGenerate)
        {
            _logger.LogWarning("Brand {BrandId} owner has exceeded their posts quota.", brandId);
            await _brandRepo.InsertActivityAsync(brandId, "quota_warning", "Automated posting paused because post quota is exhausted.");
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

                // ── Media Generation (Platform-specific) ────────
                switch (platform)
                {
                    case SocialPlatform.Instagram:
                        _logger.LogInformation("Generating image for Instagram post (brand {BrandId})", brandId);
                        var imageUrl = await _mediaService.GenerateImageAsync(brand, generatedPost.Copy, contentPillar);
                        if (!string.IsNullOrEmpty(imageUrl))
                        {
                            socialPost.MediaUrl = imageUrl;
                            socialPost.MediaType = "image";
                        }
                        else
                        {
                            _logger.LogWarning("Image generation failed for Instagram post. Post will be skipped (Instagram requires media).");
                            await _brandRepo.InsertActivityAsync(brandId, "media_failed", "Instagram post skipped because image generation failed.");
                            continue; // Skip — Instagram requires an image
                        }
                        break;

                    case SocialPlatform.TikTok:
                        _logger.LogInformation("Generating video for TikTok post (brand {BrandId})", brandId);
                        var videoUrl = await _mediaService.GenerateVideoAsync(brand, generatedPost.Copy, contentPillar);
                        if (!string.IsNullOrEmpty(videoUrl))
                        {
                            socialPost.MediaUrl = videoUrl;
                            socialPost.MediaType = "video";
                        }
                        else
                        {
                            _logger.LogWarning("Video generation failed for TikTok post. Post will be skipped (TikTok requires video).");
                            await _brandRepo.InsertActivityAsync(brandId, "media_failed", "TikTok post skipped because video generation failed.");
                            continue; // Skip — TikTok requires a video
                        }
                        break;

                    // Twitter and LinkedIn: text-only, no media needed
                    default:
                        break;
                }

                await _socialRepo.CreatePostAsync(socialPost);
                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate post for {Platform} for brand {BrandId}", platform, brandId);
                await _brandRepo.InsertActivityAsync(brandId, "error", $"Failed to generate post for {platform}: {ex.Message}");
            }
        }

        if (successCount > 0)
        {
            await _quotaService.IncrementPostsUsedAsync(brand.OwnerId, successCount);
            await _brandRepo.InsertActivityAsync(brandId, "post_generated", $"Successfully queued {successCount} posts for various platforms based on pillar: {contentPillar}.");
        }
    }
}
