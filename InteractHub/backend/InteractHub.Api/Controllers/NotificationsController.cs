using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Services.Interface;
using System.Security.Claims;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }


    /// Get all notifications for the current user with pagination
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationResponseDTO>>> GetMyNotifications(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 10)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        if (userId == Guid.Empty)
            return Unauthorized("User not found");

        var notifications = await _notificationService.GetUserNotificationsAsync(userId, skip, take);
        return Ok(notifications);
    }


    /// Get a specific notification by ID
    
    [HttpGet("{notificationId}")]
    public async Task<ActionResult<NotificationResponseDTO>> GetNotification(Guid notificationId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        if (userId == Guid.Empty)
            return Unauthorized("User not found");

        var notification = await _notificationService.GetNotificationByIdAsync(notificationId, userId);
        if (notification == null)
            return NotFound("Notification not found");

        return Ok(notification);
    }

    /// Create a new notification
    [HttpPost]
    public async Task<ActionResult<NotificationResponseDTO>> CreateNotification([FromBody] CreateNotificationDTO request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var notification = await _notificationService.CreateNotificationAsync(request);
            return CreatedAtAction(nameof(GetNotification), new { notificationId = notification.Id }, notification);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }


    /// Mark a notification as read
    
    [HttpPut("{notificationId}/read")]
    public async Task<ActionResult> MarkAsRead(Guid notificationId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        if (userId == Guid.Empty)
            return Unauthorized("User not found");

        var result = await _notificationService.MarkAsReadAsync(notificationId, userId);
        if (!result)
            return NotFound("Notification not found");

        return NoContent();
    }

    /// Mark all notifications as read for the current user
    [HttpPut("mark-all-read")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        if (userId == Guid.Empty)
            return Unauthorized("User not found");

        var result = await _notificationService.MarkAllAsReadAsync(userId);
        if (!result)
            return BadRequest("No unread notifications to mark");

        return NoContent();
    }

    /// Delete a notification
    [HttpDelete("{notificationId}")]
    public async Task<ActionResult> DeleteNotification(Guid notificationId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        if (userId == Guid.Empty)
            return Unauthorized("User not found");

        var result = await _notificationService.DeleteNotificationAsync(notificationId, userId);
        if (!result)
            return NotFound("Notification not found");

        return NoContent();
    }


    /// Get unread notification count for the current user
    
    [HttpGet("unread/count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        if (userId == Guid.Empty)
            return Unauthorized("User not found");

        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(count);
    }
}
