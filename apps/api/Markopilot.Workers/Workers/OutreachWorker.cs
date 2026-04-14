using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

using Markopilot.Core.Utilities;

namespace Markopilot.Workers.Workers;

public class OutreachWorker : IOutreachWorker
{
    private readonly IOutreachService _outreachService;
    private readonly IContentGenerationService _contentService;
    private readonly IOutreachRepository _outreachRepo;
    private readonly ILeadRepository _leadRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly IEmailPatternRepository _patternRepo;
    private readonly ILogger<OutreachWorker> _logger;

    public OutreachWorker(
        IOutreachService outreachService,
        IContentGenerationService contentService,
        IOutreachRepository outreachRepo,
        ILeadRepository leadRepo,
        IBrandRepository brandRepo,
        IEmailPatternRepository patternRepo,
        ILogger<OutreachWorker> logger)
    {
        _outreachService = outreachService;
        _contentService = contentService;
        _outreachRepo = outreachRepo;
        _leadRepo = leadRepo;
        _brandRepo = brandRepo;
        _patternRepo = patternRepo;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting global Outreach execution.");

        var brands = await _brandRepo.GetActiveOutreachBrandsAsync();
        foreach (var brand in brands)
        {
            try
            {
                var dailyLimit = brand.AutomationOutreachDailyLimit > 0 ? brand.AutomationOutreachDailyLimit : 20;

                // Connection safety check
                if (!brand.GmailConnected || string.IsNullOrEmpty(brand.GmailAccessToken))
                {
                    _logger.LogWarning("Brand {BrandId} has outreach enabled but Gmail is not connected or token is missing. Skipping.", brand.Id);
                    await _brandRepo.InsertActivityAsync(brand.Id, "connection_skipped", "Outreach skipped because Gmail is not connected or token is missing.");
                    continue;
                }

                var emails = await _outreachRepo.GetQueuedOutreachEmailsToProcessAsync(brand.Id, dailyLimit);

                if (emails.Any())
                {
                    _logger.LogInformation("Found {Count} initial emails to process for brand {BrandId}.", emails.Count, brand.Id);
                    foreach (var email in emails)
                    {
                        if (string.IsNullOrWhiteSpace(email.RecipientEmail))
                        {
                            await _outreachRepo.UpdateOutreachEmailStatusAsync(email.Id, "failed", errorMessage: "Missing recipient email address.");
                            continue;
                        }

                        // Evaluate SuppressionList matches
                        var isSuppressed = await _outreachRepo.IsEmailSuppressedAsync(brand.Id, email.RecipientEmail);
                        if (isSuppressed)
                        {
                            await _outreachRepo.UpdateOutreachEmailStatusAsync(email.Id, "failed", errorMessage: "Recipient is on the suppression list.");
                            continue;
                        }

                        // Check if copy is generated or needs generation
                        if (string.IsNullOrWhiteSpace(email.BodyText))
                        {
                            var lead = email.LeadId.HasValue ? await _leadRepo.GetLeadByIdAsync(brand.Id, email.LeadId.Value, brand.OwnerId) : null;
                            if (lead == null)
                            {
                                await _outreachRepo.UpdateOutreachEmailStatusAsync(email.Id, "failed", errorMessage: "Lead data missing for AI generation.");
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
                                    _logger.LogWarning("Email for lead {LeadId} failed spam check twice: {Reason}. Skipping.", email.LeadId, reason);
                                    await _outreachRepo.UpdateOutreachEmailStatusAsync(email.Id, "failed", errorMessage: $"Spam heuristic failure: {reason}");
                                    await _brandRepo.InsertActivityAsync(brand.Id, "outreach_skipped", $"Email to {email.RecipientEmail} skipped due to spam check failure: {reason}");
                                    continue;
                                }
                            }

                            email.Subject = generated.Subject;
                            email.BodyText = generated.BodyText;
                            email.BodyHtml = generated.BodyHtml;
                            
                            await _outreachRepo.UpdateOutreachEmailContentAsync(email.Id, email.Subject, email.BodyText, email.BodyHtml);
                        }

                        // Dispatch to Gmail
                        await _outreachService.DispatchRFC2822EmailAsync(brand, email.RecipientEmail, email.Subject, email.BodyText, email.BodyHtml);
                        
                        // Mark as sent
                        await _outreachRepo.UpdateOutreachEmailStatusAsync(email.Id, "sent");
                        await _brandRepo.InsertActivityAsync(brand.Id, "email_sent", $"Sent outreach email to {email.RecipientEmail}.");
                    }
                }
                else
                {
                    _logger.LogInformation("No initial emails found for brand {BrandId}, checking follow-up queue.", brand.Id);
                }

                // --- AUTOMATED FOLLOW-UPS ---
                // Find emails sent 3+ days ago that haven't been followed up on
                var followUps = await _outreachRepo.GetEmailsNeedingFollowUpAsync(brand.Id, delayDays: 3);
                _logger.LogInformation("Found {Count} emails needing follow-up.", followUps.Count); 
                foreach (var original in followUps)
                {
                    try
                    {
                        _logger.LogInformation("Processing follow-up for email {EmailId} from Lead {LeadId}.", original.Id, original.LeadId);
                        
                        // 1. Fetch lead for feedback and generation
                        var lead = original.LeadId.HasValue ? await _leadRepo.GetLeadByIdAsync(brand.Id, original.LeadId.Value, brand.OwnerId) : null;

                        // 2. Check for replies first
                        if (await _outreachService.HasRecipientRepliedAsync(brand, original.RecipientEmail, original.SentAt ?? DateTimeOffset.UtcNow))
                        {
                            await _outreachRepo.MarkFollowUpScheduledAsync(original.Id);
                            if (lead != null)
                            {
                                await _leadRepo.UpdateLeadStatusAsync(lead.Id, "interested");
                                await _brandRepo.InsertActivityAsync(brand.Id, "lead_replied", $"Recipient {original.RecipientEmail} replied! Automated follow-ups stopped.");

                                // ── FEEDBACK LOOP: Boost pattern confidence ─────
                                if (!string.IsNullOrEmpty(lead.Email))
                                {
                                    var (f, l) = EmailUtils.ParseName(lead.Name);
                                    var domain = lead.Email.Split('@').Last();
                                    var matchedPattern = EmailUtils.IdentifyPattern(lead.Email, f, l, domain);
                                    if (matchedPattern != null)
                                    {
                                        await _patternRepo.RecordOutcomeAsync(domain, matchedPattern, true);
                                    }
                                }
                            }
                            continue;
                        }

                        if (lead == null)
                        {
                            await _outreachRepo.MarkFollowUpScheduledAsync(original.Id); // Skip if lead missing
                            continue;
                        }

                        var generated = await _contentService.GenerateFollowUpEmailAsync(brand, lead, original.Subject);
                        
                        var followUp = new OutreachEmail
                        {
                            BrandId = brand.Id,
                            LeadId = lead.Id,
                            RecipientEmail = original.RecipientEmail,
                            RecipientName = original.RecipientName,
                            Subject = generated.Subject,
                            BodyText = generated.BodyText,
                            BodyHtml = generated.BodyHtml,
                            Status = "queued",
                            ScheduledSendAt = DateTimeOffset.UtcNow // The worker will pick it up in the next pass
                        };

                        await _outreachRepo.CreateOutreachEmailAsync(followUp);
                        await _outreachRepo.MarkFollowUpScheduledAsync(original.Id);
                        await _brandRepo.InsertActivityAsync(brand.Id, "follow_up_scheduled", $"Scheduled an automated follow-up nudge for {original.RecipientEmail}.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process follow-up for email {EmailId}", original.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process outreach for brand {BrandId}", brand.Id);
            }
        }
    }
}
