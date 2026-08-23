using Markopilot.Core.Interfaces;
using Markopilot.Core.Models;
using Microsoft.Extensions.Logging;

namespace Markopilot.Workers.Workers;

/// <summary>
/// Monitors trial and subscription expiry, sends reminder emails, and pauses engines when needed.
/// Runs daily via Hangfire recurring job.
/// </summary>
public class SubscriptionMonitoringWorker
{
    private readonly IUserRepository _userRepo;
    private readonly IAlertEmailService? _alertEmailService;
    private readonly ILogger<SubscriptionMonitoringWorker> _logger;

    public SubscriptionMonitoringWorker(
        IUserRepository userRepo,
        ILogger<SubscriptionMonitoringWorker> logger,
        IAlertEmailService? alertEmailService = null)
    {
        _userRepo = userRepo;
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
                
                // Pause the engine by setting status to paused
                await _userRepo.UpdateUserStatusAsync(user.Id, "paused");
                
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
                
                // Pause the engine by setting status to paused
                await _userRepo.UpdateUserStatusAsync(user.Id, "paused");
                
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
}