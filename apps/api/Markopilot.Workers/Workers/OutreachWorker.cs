using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Markopilot.Infrastructure.Supabase;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

public class OutreachWorker : IOutreachWorker
{
    private readonly IOutreachService _outreachService;
    private readonly IContentGenerationService _contentService;
    private readonly SupabaseRepository _repo;
    private readonly ILogger<OutreachWorker> _logger;

    public OutreachWorker(
        IOutreachService outreachService,
        IContentGenerationService contentService,
        SupabaseRepository repo,
        ILogger<OutreachWorker> logger)
    {
        _outreachService = outreachService;
        _contentService = contentService;
        _repo = repo;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting global Outreach execution.");

        var brands = await _repo.GetActiveOutreachBrandsAsync();
        foreach (var brand in brands)
        {
            try
            {
                var dailyLimit = brand.AutomationOutreachDailyLimit > 0 ? brand.AutomationOutreachDailyLimit : 20;
                var emails = await _repo.GetQueuedOutreachEmailsToProcessAsync(brand.Id, dailyLimit);

                if (!emails.Any()) continue;

                foreach (var email in emails)
                {
                    // Evaluate SuppressionList matches
                    var isSuppressed = await _repo.IsEmailSuppressedAsync(brand.Id, email.RecipientEmail);
                    if (isSuppressed)
                    {
                        await _repo.UpdateOutreachEmailStatusAsync(email.Id, "failed", errorMessage: "Recipient is on the suppression list.");
                        continue;
                    }

                    // Check if copy is generated or needs generation
                    if (string.IsNullOrWhiteSpace(email.BodyText))
                    {
                        var lead = email.LeadId.HasValue ? await _repo.GetLeadByIdAsync(brand.Id, email.LeadId.Value, brand.OwnerId) : null;
                        if (lead == null)
                        {
                            await _repo.UpdateOutreachEmailStatusAsync(email.Id, "failed", errorMessage: "Lead data missing for AI generation.");
                            continue;
                        }

                        var generated = await _contentService.GenerateOutreachEmailAsync(brand, lead);
                        
                        // Spam boundary check
                        if (!_outreachService.ValidateSpamScore(generated.BodyText, out var reason))
                        {
                            // Retry once
                            generated = await _contentService.GenerateOutreachEmailAsync(brand, lead);
                            if (!_outreachService.ValidateSpamScore(generated.BodyText, out reason))
                            {
                                await _repo.UpdateOutreachEmailStatusAsync(email.Id, "failed", errorMessage: $"Spam heuristic failure: {reason}");
                                continue;
                            }
                        }

                        email.Subject = generated.Subject;
                        email.BodyText = generated.BodyText;
                        email.BodyHtml = generated.BodyHtml;
                        
                        await _repo.UpdateOutreachEmailContentAsync(email.Id, email.Subject, email.BodyText, email.BodyHtml);
                    }

                    // Dispatch to Gmail
                    await _outreachService.DispatchRFC2822EmailAsync(brand, email.RecipientEmail, email.Subject, email.BodyText, email.BodyHtml);
                    
                    // Mark as sent
                    await _repo.UpdateOutreachEmailStatusAsync(email.Id, "sent");
                    await _repo.InsertActivityAsync(brand.Id, "email_sent", $"Sent outreach email to {email.RecipientEmail}.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process outreach for brand {BrandId}", brand.Id);
            }
        }
    }
}
