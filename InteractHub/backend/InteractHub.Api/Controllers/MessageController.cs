using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using InteractHub.Api.DTOs;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Hubs;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly IHubContext<ChatHub> _hubContext;

    public MessageController(IMessageService messageService, IHubContext<ChatHub> hubContext)
    {
        _messageService = messageService;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Gửi tin nhắn mới đến user khác (REST — cũng push qua SignalR)
    /// </summary>
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] CreateMessageDTO createMessageDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var senderId))
            {
                return Unauthorized(ApiResponse<string>.Fail("Invalid token"));
            }

            var message = await _messageService.SendMessageAsync(createMessageDto, senderId);

            // Push real-time đến receiver qua SignalR
            await _hubContext.Clients
                .Group($"user-{createMessageDto.ReceiverId}")
                .SendAsync("ReceiveMessage", message);

            return Ok(ApiResponse<MessageResponseDTO>.Ok(message, "Message sent successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("An error occurred", new List<string> { ex.Message }));
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
                return Unauthorized(ApiResponse<string>.Fail("Invalid token"));
            }

            var conversation = await _messageService.GetConversationAsync(userId, otherUserId);
            return Ok(ApiResponse<List<MessageResponseDTO>>.Ok(conversation, "Conversation retrieved successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("An error occurred", new List<string> { ex.Message }));
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
                return Unauthorized(ApiResponse<string>.Fail("Invalid token"));
            }

            var conversations = await _messageService.GetConversationsAsync(userId);
            return Ok(ApiResponse<List<ConversationDTO>>.Ok(conversations, "Conversations retrieved successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("An error occurred", new List<string> { ex.Message }));
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
                return NotFound(ApiResponse<string>.Fail("Message not found"));
            }

            return Ok(ApiResponse<MessageResponseDTO>.Ok(message, "Message retrieved successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("An error occurred", new List<string> { ex.Message }));
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
                return NotFound(ApiResponse<string>.Fail("Message not found"));
            }

            return Ok(ApiResponse<bool>.Ok(true, "Message marked as read"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("An error occurred", new List<string> { ex.Message }));
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
                return Unauthorized(ApiResponse<string>.Fail("Invalid token"));
            }

            var result = await _messageService.DeleteMessageAsync(messageId, userId);
            if (!result)
            {
                return BadRequest(ApiResponse<string>.Fail("Failed to delete message or unauthorized"));
            }

            return Ok(ApiResponse<bool>.Ok(true, "Message deleted successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("An error occurred", new List<string> { ex.Message }));
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
                return Unauthorized(ApiResponse<string>.Fail("Invalid token"));
            }

            var count = await _messageService.GetUnreadMessageCountAsync(userId);
            return Ok(ApiResponse<int>.Ok(count, "Unread count retrieved successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("An error occurred", new List<string> { ex.Message }));
        }
    }
}