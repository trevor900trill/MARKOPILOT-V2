using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Utilities;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

public class BounceProcessorWorker : IBounceProcessorWorker
{
    private readonly IOutreachService _outreachService;
    private readonly IBrandRepository _brandRepo;
    private readonly ILeadRepository _leadRepo;
    private readonly IEmailPatternRepository _patternRepo;
    private readonly ILogger<BounceProcessorWorker> _logger;

    public BounceProcessorWorker(
        IOutreachService outreachService,
        IBrandRepository brandRepo,
        ILeadRepository leadRepo,
        IEmailPatternRepository patternRepo,
        ILogger<BounceProcessorWorker> logger)
    {
        _outreachService = outreachService;
        _brandRepo = brandRepo;
        _leadRepo = leadRepo;
        _patternRepo = patternRepo;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 1)]
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting Bounce Processor run.");

        var brands = await _brandRepo.GetActiveOutreachBrandsAsync();
        foreach (var brand in brands)
        {
            try
            {
                var since = brand.LastBounceCheckAt ?? DateTimeOffset.UtcNow.AddDays(-1);
                var bouncedEmails = await _outreachService.GetBouncedEmailsAsync(brand, since);

                if (bouncedEmails.Count == 0) continue;

                _logger.LogInformation("Found {Count} bounced emails for brand {BrandName}", bouncedEmails.Count, brand.Name);

                foreach (var email in bouncedEmails)
                {
                    try
                    {
                        // 1. Mark lead as disqualified/bounced if found
                        // We need a way to find a lead by email globally for this brand
                        // For now we'll just focus on pattern intelligence
                        
                        var domain = email.Split('@').Last();
                        var (f, l) = EmailUtils.ParseName(email.Split('@').First()); // Loose name match
                        
                        // Try to find the pattern that produced this bounce
                        var matchedPattern = EmailUtils.IdentifyPattern(email, f, l, domain);
                        if (matchedPattern != null)
                        {
                            await _patternRepo.RecordOutcomeAsync(domain, matchedPattern, false);
                            _logger.LogWarning("Negative Feedback: Pattern {Pattern} for {Domain} recorded a bounce (from {Email}).", matchedPattern, domain, email);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process bounce for {Email}", email);
                    }
                }

                await _brandRepo.UpdateBrandBounceCheckAtAsync(brand.Id, DateTimeOffset.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed bounce processing for brand {BrandId}", brand.Id);
            }
        }
    }
}
