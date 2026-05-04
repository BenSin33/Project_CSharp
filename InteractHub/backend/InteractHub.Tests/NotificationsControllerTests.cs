using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using InteractHub.Api.Controllers;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Tests;

public class NotificationsControllerTests
{
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly NotificationsController _notificationsController;
    private readonly Guid _testUserId;

    public NotificationsControllerTests()
    {
        _testUserId = Guid.NewGuid();
        _notificationServiceMock = new Mock<INotificationService>();
        _notificationsController = new NotificationsController(_notificationServiceMock.Object);
        
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()) };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        _notificationsController.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } };
    }

    [Fact]
    public async Task GetMyNotifications_ValidRequest_ReturnsPaginatedNotifications()
    {
        var notifications = new List<NotificationResponseDTO>
        {
            new NotificationResponseDTO { Id = Guid.NewGuid(), Content = "Message 1", Type = NotificationType.Like, IsRead = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new NotificationResponseDTO { Id = Guid.NewGuid(), Content = "Message 2", Type = NotificationType.Comment, IsRead = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _notificationServiceMock.Setup(x => x.GetUserNotificationsAsync(_testUserId, 0, 10)).ReturnsAsync(notifications);
        var result = await _notificationsController.GetMyNotifications(0, 10);
        
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<IEnumerable<NotificationResponseDTO>>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task GetNotification_OwnerRequesting_ReturnsNotification()
    {
        var notificationId = Guid.NewGuid();
        var notification = new NotificationResponseDTO { Id = notificationId, Content = "Test", Type = NotificationType.Like, IsRead = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _notificationServiceMock.Setup(x => x.GetNotificationByIdAsync(notificationId, _testUserId)).ReturnsAsync(notification);
        var result = await _notificationsController.GetNotification(notificationId);
        
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<NotificationResponseDTO>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task GetNotification_NonOwnerRequesting_ReturnsNotFound()
    {
        var notificationId = Guid.NewGuid();

        _notificationServiceMock.Setup(x => x.GetNotificationByIdAsync(notificationId, _testUserId)).ReturnsAsync((NotificationResponseDTO?)null);
        var result = await _notificationsController.GetNotification(notificationId);
        
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateNotification_ValidData_ReturnsCreatedAtAction()
    {
        var createDto = new CreateNotificationDTO { UserId = _testUserId, Content = "New", Type = NotificationType.Like };
        var createdNotification = new NotificationResponseDTO { Id = Guid.NewGuid(), Content = "New", Type = NotificationType.Like, IsRead = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _notificationServiceMock.Setup(x => x.CreateNotificationAsync(createDto)).ReturnsAsync(createdNotification);
        var result = await _notificationsController.CreateNotification(createDto);
        
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var response = Assert.IsType<ApiResponse<NotificationResponseDTO>>(createdResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task MarkAsRead_OwnerRequesting_ReturnsNoContent()
    {
        var notificationId = Guid.NewGuid();

        _notificationServiceMock.Setup(x => x.MarkAsReadAsync(notificationId, _testUserId)).ReturnsAsync(true);
        var result = await _notificationsController.MarkAsRead(notificationId);
        
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<bool>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task MarkAsRead_NonOwnerRequesting_ReturnsNotFound()
    {
        var notificationId = Guid.NewGuid();

        _notificationServiceMock.Setup(x => x.MarkAsReadAsync(notificationId, _testUserId)).ReturnsAsync(false);
        var result = await _notificationsController.MarkAsRead(notificationId);
        
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task MarkAllAsRead_ValidRequest_ReturnsNoContent()
    {
        _notificationServiceMock.Setup(x => x.MarkAllAsReadAsync(_testUserId)).ReturnsAsync(true);
        var result = await _notificationsController.MarkAllAsRead();
        
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<bool>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task DeleteNotification_OwnerRequesting_ReturnsNoContent()
    {
        var notificationId = Guid.NewGuid();

        _notificationServiceMock.Setup(x => x.DeleteNotificationAsync(notificationId, _testUserId)).ReturnsAsync(true);
        var result = await _notificationsController.DeleteNotification(notificationId);
        
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<bool>>(okResult.Value);
        Assert.True(response.Success);
    }

    [Fact]
    public async Task DeleteNotification_NonOwnerRequesting_ReturnsNotFound()
    {
        var notificationId = Guid.NewGuid();

        _notificationServiceMock.Setup(x => x.DeleteNotificationAsync(notificationId, _testUserId)).ReturnsAsync(false);
        var result = await _notificationsController.DeleteNotification(notificationId);
        
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetUnreadCount_ValidRequest_ReturnsCount()
    {
        _notificationServiceMock.Setup(x => x.GetUnreadCountAsync(_testUserId)).ReturnsAsync(5);
        var result = await _notificationsController.GetUnreadCount();
        
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<int>>(okResult.Value);
        Assert.Equal(5, response.Data);
    }
}
