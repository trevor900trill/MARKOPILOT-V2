using Markopilot.Core.Models;

namespace Markopilot.Core.Interfaces;

/// <summary>
/// Data access for in-app notifications.
/// Used by: API (future NotificationsController)
///          Workers (future — workers can create notifications for users)
/// </summary>
public interface INotificationRepository
{
    // ── Create ───────────────────────────────────
    /// <summary>Create a new notification for a user.</summary>
    Task CreateNotificationAsync(Notification notification);

    // ── Read ─────────────────────────────────────
    /// <summary>Get recent notifications for a user.</summary>
    Task<List<Notification>> GetNotificationsAsync(Guid userId, int count = 10);

    /// <summary>Get the count of unread notifications for a user.</summary>
    Task<int> GetUnreadNotificationCountAsync(Guid userId);

    // ── Update ───────────────────────────────────
    /// <summary>Mark all notifications as read for a user.</summary>
    Task MarkNotificationsReadAsync(Guid userId);
}
