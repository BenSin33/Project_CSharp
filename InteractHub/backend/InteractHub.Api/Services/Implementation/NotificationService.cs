using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Hubs;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Interface;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Data;

namespace InteractHub.Api.Services.Implementation;

public class NotificationService : INotificationService
{
    private readonly IGenericRepository<Notification> _notificationRepo;
    private readonly IGenericRepository<User> _userRepo;
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(
        IGenericRepository<Notification> notificationRepo,
        IGenericRepository<User> userRepo,
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext)
    {
        _notificationRepo = notificationRepo;
        _userRepo = userRepo;
        _context = context;
        _hubContext = hubContext;
    }

    public async Task<IEnumerable<NotificationResponseDTO>> GetUserNotificationsAsync(Guid userId, int skip = 0, int take = 10)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && n.DeletedAt == null)
            .Include(n => n.Actor)
            .OrderByDescending(n => n.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(n => MapToDTO(n))
            .ToListAsync();
    }

    public async Task<NotificationResponseDTO?> GetNotificationByIdAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .Include(n => n.Actor)
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.DeletedAt == null && n.UserId == userId);

        return notification == null ? null : MapToDTO(notification);
    }

    public async Task<NotificationResponseDTO> CreateNotificationAsync(CreateNotificationDTO request)
    {
        var user = await _userRepo.GetByIdAsync(request.UserId);
        if (user == null)
            throw new Exception("User not found.");

        // Don't send notification to yourself
        if (request.ActorId.HasValue && request.ActorId.Value == request.UserId)
            return new NotificationResponseDTO { Id = Guid.Empty };

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            Type = request.Type,
            UserId = request.UserId,
            ActorId = request.ActorId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _notificationRepo.AddAsync(notification);
        await _notificationRepo.SaveChangesAsync();

        // Load actor info
        if (request.ActorId.HasValue)
            notification.Actor = await _userRepo.GetByIdAsync(request.ActorId.Value);

        var dto = MapToDTO(notification);

        // Push real-time via SignalR
        await _hubContext.Clients
            .Group($"notify-{request.UserId}")
            .SendAsync("ReceiveNotification", dto);

        return dto;
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

        if (!userNotifications.Any()) return false;

        foreach (var n in userNotifications)
        {
            n.IsRead = true;
            n.UpdatedAt = DateTime.UtcNow;
            _notificationRepo.Update(n);
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
        return await _context.Notifications
            .Where(n => n.UserId == userId && n.DeletedAt == null && !n.IsRead)
            .CountAsync();
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
            ActorId = notification.ActorId,
            ActorName = notification.Actor?.FullName,
            ActorAvatarUrl = notification.Actor?.AvatarUrl,
            CreatedAt = notification.CreatedAt,
            UpdatedAt = notification.UpdatedAt
        };
    }
}