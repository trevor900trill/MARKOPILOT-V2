using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Abstraction for user DB access needed by Core services (e.g. QuotaService).
/// Implemented by SupabaseRepository in Infrastructure to maintain clean layering.
/// </summary>
public interface IUserRepository
{
    Task<User?> GetUserByIdAsync(Guid userId);
    Task IncrementQuotaPostsUsedAsync(Guid userId, int count = 1);
    Task IncrementQuotaLeadsUsedAsync(Guid userId, int count = 1);
    Task ResetQuotaCountersAsync(Guid userId);
    Task UpdateOnboardingStatusAsync(Guid userId, bool completed);
}
