using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class NotificationService : INotificationService
{
    private readonly IGenericRepository<Notification> _notificationRepo;
    private readonly IGenericRepository<User> _userRepo;

    public NotificationService(IGenericRepository<Notification> notificationRepo, IGenericRepository<User> userRepo)
    {
        _notificationRepo = notificationRepo;
        _userRepo = userRepo;
    }

    public async Task<IEnumerable<NotificationResponseDTO>> GetUserNotificationsAsync(Guid userId, int skip = 0, int take = 10)
    {
        var notifications = await _notificationRepo.GetAllAsync();
        return notifications
            .Where(n => n.UserId == userId && n.DeletedAt == null)
            .OrderByDescending(n => n.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(n => MapToDTO(n));
    }

    public async Task<NotificationResponseDTO?> GetNotificationByIdAsync(Guid notificationId, Guid userId)
    {
        var notification = await _notificationRepo.GetByIdAsync(notificationId);
        
        if (notification == null || notification.DeletedAt != null || notification.UserId != userId)
            return null;

        return MapToDTO(notification);
    }

    public async Task<NotificationResponseDTO> CreateNotificationAsync(CreateNotificationDTO request)
    {
        var user = await _userRepo.GetByIdAsync(request.UserId);
        if (user == null)
            throw new Exception("User not found.");

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            Type = request.Type,
            UserId = request.UserId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _notificationRepo.AddAsync(notification);
        await _notificationRepo.SaveChangesAsync();

        return MapToDTO(notification);
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _notificationRepo.GetByIdAsync(notificationId);
        if (notification == null || notification.DeletedAt != null || notification.UserId != userId)
            return false;

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;

        _notificationRepo.Update(notification);
        await _notificationRepo.SaveChangesAsync();

        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _notificationRepo.GetAllAsync();
        var userNotifications = notifications
            .Where(n => n.UserId == userId && n.DeletedAt == null && !n.IsRead)
            .ToList();

        if (!userNotifications.Any())
            return false;

        foreach (var notification in userNotifications)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;

            _notificationRepo.Update(notification);
        }

        await _notificationRepo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteNotificationAsync(Guid notificationId, Guid userId)
    {
        var notification = await _notificationRepo.GetByIdAsync(notificationId);
        if (notification == null || notification.DeletedAt != null || notification.UserId != userId)
            return false;

        notification.DeletedAt = DateTime.UtcNow;
        _notificationRepo.Update(notification);
        await _notificationRepo.SaveChangesAsync();

        return true;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        var notifications = await _notificationRepo.GetAllAsync();
        return notifications
            .Where(n => n.UserId == userId && n.DeletedAt == null && !n.IsRead)
            .Count();
    }

    private static NotificationResponseDTO MapToDTO(Notification notification)
    {
        return new NotificationResponseDTO
        {
            Id = notification.Id,
            Content = notification.Content,
            Type = notification.Type,
            IsRead = notification.IsRead,
            UserId = notification.UserId,
            CreatedAt = notification.CreatedAt,
            UpdatedAt = notification.UpdatedAt
        };
    }
}
