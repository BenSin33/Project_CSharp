using Moq;
using Xunit;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Repositories;

using Microsoft.AspNetCore.SignalR;
using InteractHub.Api.Hubs;

namespace InteractHub.Tests;

public class NotificationServiceTests : TestBase
{
    private readonly Mock<IGenericRepository<Notification>> _notificationRepositoryMock;
    private readonly Mock<IGenericRepository<User>> _userRepositoryMock;
    private readonly NotificationService _notificationService;

    public NotificationServiceTests()
    {
        _notificationRepositoryMock = new Mock<IGenericRepository<Notification>>();
        _userRepositoryMock = new Mock<IGenericRepository<User>>();
        _notificationService = new NotificationService(_notificationRepositoryMock.Object, _userRepositoryMock.Object, CreateDbContext(), CreateHubContextMock().Object);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_ValidUserId_ReturnsPaginatedNotifications()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), UserId = userId, Content = "Test 1", CreatedAt = DateTime.UtcNow, DeletedAt = null, IsRead = false, Type = NotificationType.Like },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Content = "Test 2", CreatedAt = DateTime.UtcNow.AddHours(-1), DeletedAt = null, IsRead = true, Type = NotificationType.Comment }
        };

        _notificationRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(notifications);
        var result = await _notificationService.GetUserNotificationsAsync(userId, 0, 10);
        
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetUserNotificationsAsync_WithDeletedNotifications_ExcludesDeleted()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), UserId = userId, Content = "Active", DeletedAt = null, Type = NotificationType.Like },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Content = "Deleted", DeletedAt = DateTime.UtcNow, Type = NotificationType.Message }
        };

        _notificationRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(notifications);
        var result = await _notificationService.GetUserNotificationsAsync(userId, 0, 10);
        
        Assert.Single(result);
        Assert.Equal("Active", result.First().Content);
    }

    [Fact]
    public async Task GetNotificationByIdAsync_OwnerRequesting_ReturnsNotification()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = userId, Content = "Test", DeletedAt = null, Type = NotificationType.Like };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId)).ReturnsAsync(notification);
        var result = await _notificationService.GetNotificationByIdAsync(notificationId, userId);
        
        Assert.NotNull(result);
        Assert.Equal(notificationId, result.Id);
    }

    [Fact]
    public async Task GetNotificationByIdAsync_NonOwnerRequesting_ReturnsNull()
    {
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = ownerId, Content = "Test", DeletedAt = null, Type = NotificationType.Like };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId)).ReturnsAsync(notification);
        var result = await _notificationService.GetNotificationByIdAsync(notificationId, requesterId);
        
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateNotificationAsync_ValidData_CreatesNotification()
    {
        var userId = Guid.NewGuid();
        var dto = new CreateNotificationDTO { UserId = userId, Content = "New notification", Type = NotificationType.Like };
        
        var user = new User { Id = userId, Email = "test@example.com", UserName = "testuser" };
        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);

        Notification? capturedNotification = null;
        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>()))
            .Callback<Notification>(n => capturedNotification = n)
            .Returns(Task.CompletedTask);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        await _notificationService.CreateNotificationAsync(dto);

        Assert.NotNull(capturedNotification);
        Assert.Equal(userId, capturedNotification.UserId);
        Assert.Equal("New notification", capturedNotification.Content);
    }

    [Fact]
    public async Task MarkAsReadAsync_OwnerRequesting_MarksAsRead()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = userId, IsRead = false, DeletedAt = null, Content = "Test", Type = NotificationType.Like };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId)).ReturnsAsync(notification);
        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await _notificationService.MarkAsReadAsync(notificationId, userId);

        Assert.True(result);
        Assert.True(notification.IsRead);
    }

    [Fact]
    public async Task MarkAsReadAsync_NonOwnerRequesting_ReturnsFalse()
    {
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = ownerId, IsRead = false, Content = "Test", Type = NotificationType.Like };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId)).ReturnsAsync(notification);
        var result = await _notificationService.MarkAsReadAsync(notificationId, requesterId);
        
        Assert.False(result);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_ValidUserId_MarksAllAsRead()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false, DeletedAt = null, Content = "1", Type = NotificationType.Like },
            new Notification { Id = Guid.NewGuid(), UserId = userId, IsRead = false, DeletedAt = null, Content = "2", Type = NotificationType.Comment }
        };

        _notificationRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(notifications);
        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await _notificationService.MarkAllAsReadAsync(userId);

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteNotificationAsync_OwnerRequesting_SoftDeletes()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = userId, DeletedAt = null, Content = "Test", Type = NotificationType.Like };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId)).ReturnsAsync(notification);
        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await _notificationService.DeleteNotificationAsync(notificationId, userId);

        Assert.True(result);
        Assert.NotNull(notification.DeletedAt);
    }

    [Fact]
    public async Task DeleteNotificationAsync_NonOwnerRequesting_ReturnsFalse()
    {
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = ownerId, DeletedAt = null, Content = "Test", Type = NotificationType.Like };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId)).ReturnsAsync(notification);
        var result = await _notificationService.DeleteNotificationAsync(notificationId, requesterId);
        
        Assert.False(result);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ValidUserId_ReturnsUnreadCount()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { UserId = userId, IsRead = false, DeletedAt = null, Content = "1", Type = NotificationType.Like },
            new Notification { UserId = userId, IsRead = false, DeletedAt = null, Content = "2", Type = NotificationType.Comment },
            new Notification { UserId = userId, IsRead = true, DeletedAt = null, Content = "3", Type = NotificationType.Share },
            new Notification { UserId = userId, IsRead = false, DeletedAt = DateTime.UtcNow, Content = "4", Type = NotificationType.Message }
        };

        _notificationRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(notifications);
        var result = await _notificationService.GetUnreadCountAsync(userId);
        
        Assert.Equal(2, result);
    }
}
