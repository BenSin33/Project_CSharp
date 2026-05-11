using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using InteractHub.Api.DTOs;
using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMessageService _messageService;
    private readonly INotificationService _notificationService;

    public ChatHub(IMessageService messageService, INotificationService notificationService)
    {
        _messageService = messageService;
        _notificationService = notificationService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            Console.WriteLine($"[SignalR] User {userId} connected: {Context.ConnectionId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Client gọi để gửi tin nhắn real-time — lưu DB + push đến cả 2 phía
    /// </summary>
    public async Task SendMessage(string receiverId, string messageContent)
    {
        var senderIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(senderIdStr) || !Guid.TryParse(senderIdStr, out var senderId))
            throw new HubException("Unauthorized");

        if (!Guid.TryParse(receiverId, out var receiverGuid))
            throw new HubException("Invalid receiver ID");

        if (string.IsNullOrWhiteSpace(messageContent))
            throw new HubException("Message content cannot be empty");

        try
        {
            var createDto = new CreateMessageDTO(messageContent, receiverGuid);
            var saved = await _messageService.SendMessageAsync(createDto, senderId);

            // Push đến receiver
            await Clients.Group($"user-{receiverId}").SendAsync("ReceiveMessage", saved);

            // Echo lại cho sender
            await Clients.Caller.SendAsync("MessageSent", saved);

            // Create notification for receiver
            try
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                {
                    Content = $"{saved.SenderName} đã nhắn tin cho bạn",
                    Type = NotificationType.Message,
                    UserId = receiverGuid,
                    ActorId = senderId
                });
            }
            catch { /* notification failure should not block message */ }
        }
        catch (ArgumentException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    /// <summary>
    /// Đánh dấu tin nhắn đã đọc
    /// </summary>
    public async Task MarkMessageRead(string messageId)
    {
        if (!Guid.TryParse(messageId, out var msgGuid)) return;
        await _messageService.MarkAsReadAsync(msgGuid);
    }
}