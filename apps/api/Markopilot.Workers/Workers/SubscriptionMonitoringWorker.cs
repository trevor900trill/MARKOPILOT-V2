using Hangfire;
using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Monitors trial and subscription expiry, sends reminder emails, and pauses the automation engines when needed.
/// Runs daily via Hangfire recurring job.
/// </summary>
public class SubscriptionMonitoringWorker
{
    private readonly IUserRepository _userRepo;
    private readonly IBrandRepository _brandRepo;
    private readonly IAlertEmailService? _alertEmailService;
    private readonly ILogger<SubscriptionMonitoringWorker> _logger;

    public SubscriptionMonitoringWorker(
        IUserRepository userRepo,
        IBrandRepository brandRepo,
        ILogger<SubscriptionMonitoringWorker> logger,
        IAlertEmailService? alertEmailService = null)
    {
        _userRepo = userRepo;
        _brandRepo = brandRepo;
        _logger = logger;
        _alertEmailService = alertEmailService;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting subscription monitoring worker execution");

        try
        {
            var now = DateTimeOffset.UtcNow;
            
            // Check for trials expiring in 1 day
            var trialsExpiringSoon = await _userRepo.GetUsersWithTrialExpiringAsync(now.AddDays(1));
            foreach (var user in trialsExpiringSoon)
            {
                _logger.LogInformation("Trial expiring soon for user {UserId} ({Email}), ends at {TrialEndsAt}", 
                    user.Id, user.Email, user.TrialEndsAt);
                
                if (_alertEmailService != null && !string.IsNullOrEmpty(user.Email))
                {
                    await _alertEmailService.SendTrialExpiringSoonEmailAsync(
                        user.Email,
                        user.DisplayName ?? "Founder",
                        user.TrialEndsAt ?? user.CreatedAt.AddDays(7));
                }
            }

            // Check for trials that have expired
            var expiredTrials = await _userRepo.GetUsersWithExpiredTrialsAsync(now);
            foreach (var user in expiredTrials)
            {
                _logger.LogInformation("Trial expired for user {UserId} ({Email}), expired at {TrialEndsAt}", 
                    user.Id, user.Email, user.TrialEndsAt);
                
                await PauseUserAutomationsAsync(user, "the free trial period ended");
                
                if (_alertEmailService != null && !string.IsNullOrEmpty(user.Email))
                {
                    await _alertEmailService.SendTrialExpiredEmailAsync(
                        user.Email,
                        user.DisplayName ?? "Founder",
                        user.PlanName);
                }
            }

            // Check for subscriptions expiring in 3 days
            var subscriptionsExpiringSoon = await _userRepo.GetUsersWithSubscriptionExpiringAsync(now.AddDays(3));
            foreach (var user in subscriptionsExpiringSoon)
            {
                _logger.LogInformation("Subscription expiring soon for user {UserId} ({Email}), ends at {CurrentPeriodEnd}", 
                    user.Id, user.Email, user.CurrentPeriodEnd);
                
                if (_alertEmailService != null && !string.IsNullOrEmpty(user.Email))
                {
                    await _alertEmailService.SendSubscriptionExpiringSoonEmailAsync(
                        user.Email,
                        user.DisplayName ?? "Founder",
                        user.PlanName,
                        user.CurrentPeriodEnd ?? now);
                }
            }

            // Check for subscriptions that have expired
            var expiredSubscriptions = await _userRepo.GetUsersWithExpiredSubscriptionsAsync(now);
            foreach (var user in expiredSubscriptions)
            {
                _logger.LogInformation("Subscription expired for user {UserId} ({Email}), expired at {CurrentPeriodEnd}", 
                    user.Id, user.Email, user.CurrentPeriodEnd);
                
                await PauseUserAutomationsAsync(user, "the subscription period ended");
                
                if (_alertEmailService != null && !string.IsNullOrEmpty(user.Email))
                {
                    await _alertEmailService.SendSubscriptionExpiredEmailAsync(
                        user.Email,
                        user.DisplayName ?? "Founder",
                        user.PlanName);
                }
            }

            _logger.LogInformation("Subscription monitoring worker completed successfully. " +
                "Trials expiring soon: {TrialsExpiring}, Expired trials: {ExpiredTrials}, " +
                "Subscriptions expiring soon: {SubsExpiring}, Expired subscriptions: {ExpiredSubs}",
                trialsExpiringSoon.Count, expiredTrials.Count, 
                subscriptionsExpiringSoon.Count, expiredSubscriptions.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Subscription monitoring worker failed");
            throw;
        }
    }

    /// <summary>
    /// Pauses every automation engine on the user's brands and removes their recurring
    /// Hangfire jobs immediately. This is the real gate the API and workers evaluate —
    /// the user's plan/status record is left untouched.
    /// </summary>
    private async Task PauseUserAutomationsAsync(User user, string reason)
    {
        await _brandRepo.SetUserAutomationEnabledAsync(user.Id, postsEnabled: false, leadsEnabled: false, outreachEnabled: false);

        var brands = await _brandRepo.GetBrandsByOwnerAsync(user.Id);
        foreach (var brand in brands)
        {
            RecurringJob.RemoveIfExists($"brand-post-gen-{brand.Id}");
            RecurringJob.RemoveIfExists($"brand-leads-gen-{brand.Id}");

            try
            {
                await _brandRepo.InsertActivityAsync(
                    brand.Id,
                    "automation_paused",
                    $"Automation paused because {reason}. Renew via M-PESA in Account to resume autonomous posting and lead discovery.",
                    new Dictionary<string, object> { ["reason"] = reason });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log automation pause activity for brand {BrandId}", brand.Id);
            }
        }

        _logger.LogInformation("Paused automation for {BrandCount} brands owned by user {UserId} ({Reason})", brands.Count, user.Id, reason);
    }
}