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

    /// <summary>
    /// Get all notifications for the current user with pagination
    /// </summary>
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

    /// <summary>
    /// Get a specific notification by ID
    /// </summary>
    [HttpGet("{notificationId}")]
    public async Task<ActionResult<NotificationResponseDTO>> GetNotification(Guid notificationId)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(notificationId);
        if (notification == null)
            return NotFound("Notification not found");

        return Ok(notification);
    }

    /// <summary>
    /// Create a new notification
    /// </summary>
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

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPut("{notificationId}/read")]
    public async Task<ActionResult> MarkAsRead(Guid notificationId)
    {
        var result = await _notificationService.MarkAsReadAsync(notificationId);
        if (!result)
            return NotFound("Notification not found");

        return NoContent();
    }

    /// <summary>
    /// Mark all notifications as read for the current user
    /// </summary>
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

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{notificationId}")]
    public async Task<ActionResult> DeleteNotification(Guid notificationId)
    {
        var result = await _notificationService.DeleteNotificationAsync(notificationId);
        if (!result)
            return NotFound("Notification not found");

        return NoContent();
    }

    /// <summary>
    /// Get unread notification count for the current user
    /// </summary>
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
