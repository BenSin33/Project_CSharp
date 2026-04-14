using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services.Interface;

public interface INotificationService
{
    /// <summary>
    /// Get all notifications for a user with pagination
    /// </summary>
    Task<IEnumerable<NotificationResponseDTO>> GetUserNotificationsAsync(Guid userId, int skip = 0, int take = 10);

    /// <summary>
    /// Get a specific notification by ID
    /// </summary>
    Task<NotificationResponseDTO?> GetNotificationByIdAsync(Guid notificationId);

    /// <summary>
    /// Create a new notification
    /// </summary>
    Task<NotificationResponseDTO> CreateNotificationAsync(CreateNotificationDTO request);

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    Task<bool> MarkAsReadAsync(Guid notificationId);

    /// <summary>
    /// Mark all notifications as read for a user
    /// </summary>
    Task<bool> MarkAllAsReadAsync(Guid userId);

    /// <summary>
    /// Delete a notification
    /// </summary>
    Task<bool> DeleteNotificationAsync(Guid notificationId);

    /// <summary>
    /// Get unread notification count for a user
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid userId);
}
