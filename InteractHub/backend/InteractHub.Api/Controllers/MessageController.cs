using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InteractHub.Api.DTOs;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessageController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    /// <summary>
    /// Gửi tin nhắn mới đến user khác
    /// </summary>
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] CreateMessageDTO createMessageDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var senderId))
            {
                return Unauthorized(new { success = false, message = "Invalid token" });
            }

            var message = await _messageService.SendMessageAsync(createMessageDto, senderId);
            return Ok(new { success = true, message = "Message sent successfully", data = message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy cuộc hội thoại giữa 2 user (lịch sử chat)
    /// </summary>
    [HttpGet("conversation/{otherUserId}")]
    public async Task<IActionResult> GetConversation([FromRoute] Guid otherUserId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token" });
            }

            var conversation = await _messageService.GetConversationAsync(userId, otherUserId);
            return Ok(new { success = true, data = conversation });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách cuộc hội thoại của user
    /// </summary>
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token" });
            }

            var conversations = await _messageService.GetConversationsAsync(userId);
            return Ok(new { success = true, data = conversations });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết 1 tin nhắn
    /// </summary>
    [HttpGet("{messageId}")]
    public async Task<IActionResult> GetMessageById([FromRoute] Guid messageId)
    {
        try
        {
            var message = await _messageService.GetMessageByIdAsync(messageId);
            if (message == null)
            {
                return NotFound(new { success = false, message = "Message not found" });
            }

            return Ok(new { success = true, data = message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Đánh dấu tin nhắn đã đọc
    /// </summary>
    [HttpPut("{messageId}/mark-as-read")]
    public async Task<IActionResult> MarkAsRead([FromRoute] Guid messageId)
    {
        try
        {
            var result = await _messageService.MarkAsReadAsync(messageId);
            if (!result)
            {
                return NotFound(new { success = false, message = "Message not found" });
            }

            return Ok(new { success = true, message = "Message marked as read" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Xóa tin nhắn
    /// </summary>
    [HttpDelete("{messageId}")]
    public async Task<IActionResult> DeleteMessage([FromRoute] Guid messageId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token" });
            }

            var result = await _messageService.DeleteMessageAsync(messageId, userId);
            if (!result)
            {
                return BadRequest(new { success = false, message = "Failed to delete message or unauthorized" });
            }

            return Ok(new { success = true, message = "Message deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy số tin nhắn chưa đọc
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { success = false, message = "Invalid token" });
            }

            var count = await _messageService.GetUnreadMessageCountAsync(userId);
            return Ok(new { success = true, unreadCount = count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
        }
    }
}
