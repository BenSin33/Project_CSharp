using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Data;
using InteractHub.Api.DTOs;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class MessageService : IMessageService
{
    private readonly ApplicationDbContext _context;

    public MessageService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MessageResponseDTO> SendMessageAsync(CreateMessageDTO createMessageDto, Guid senderId)
    {
        if (createMessageDto.ReceiverId == senderId)
            throw new ArgumentException("You cannot send a message to yourself.");

        // Kiểm tra user nhận có tồn tại không
        var receiver = await _context.Users.FindAsync(createMessageDto.ReceiverId);
        if (receiver == null)
            throw new ArgumentException("Receiver not found");

        // Kiểm tra sender có tồn tại không
        var sender = await _context.Users.FindAsync(senderId);
        if (sender == null)
            throw new ArgumentException("Sender not found");

        // Tạo tin nhắn mới
        var message = new Message
        {
            MessageContent = createMessageDto.MessageContent,
            SenderId = senderId,
            ReceiverId = createMessageDto.ReceiverId,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return new MessageResponseDTO(
            message.Id,
            message.MessageContent,
            message.SenderId,
            sender.FullName,
            sender.AvatarUrl,
            message.ReceiverId,
            receiver.FullName,
            receiver.AvatarUrl,
            message.SentAt,
            message.IsRead
        );
    }

    public async Task<List<MessageResponseDTO>> GetConversationAsync(Guid userId, Guid otherUserId)
    {
        var messages = await _context.Messages
            .Where(m => 
                (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                (m.SenderId == otherUserId && m.ReceiverId == userId)
            )
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return messages.Select(m => new MessageResponseDTO(
            m.Id,
            m.MessageContent,
            m.SenderId,
            m.Sender?.FullName ?? "Unknown",
            m.Sender?.AvatarUrl,
            m.ReceiverId,
            m.Receiver?.FullName ?? "Unknown",
            m.Receiver?.AvatarUrl,
            m.SentAt,
            m.IsRead
        )).ToList();
    }

    public async Task<List<ConversationDTO>> GetConversationsAsync(Guid userId)
    {
        var conversations = await _context.Messages
            .Where(m => (m.SenderId == userId || m.ReceiverId == userId) && m.SenderId != m.ReceiverId)
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
            .Select(g => new
            {
                OtherUserId = g.Key,
                LastMessage = g.OrderByDescending(m => m.SentAt).FirstOrDefault(),
                UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
            })
            .ToListAsync();

        var result = new List<ConversationDTO>();
        foreach (var conv in conversations)
        {
            var otherUser = await _context.Users.FindAsync(conv.OtherUserId);
            if (otherUser != null && conv.LastMessage != null)
            {
                result.Add(new ConversationDTO(
                    conv.OtherUserId,
                    otherUser.FullName,
                    otherUser.AvatarUrl,
                    conv.LastMessage.MessageContent,
                    conv.LastMessage.SentAt,
                    conv.UnreadCount
                ));
            }
        }

        return result.OrderByDescending(c => c.LastMessageTime).ToList();
    }

    public async Task<MessageResponseDTO?> GetMessageByIdAsync(Guid messageId)
    {
        var message = await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            return null;

        return new MessageResponseDTO(
            message.Id,
            message.MessageContent,
            message.SenderId,
            message.Sender?.FullName ?? "Unknown",
            message.Sender?.AvatarUrl,
            message.ReceiverId,
            message.Receiver?.FullName ?? "Unknown",
            message.Receiver?.AvatarUrl,
            message.SentAt,
            message.IsRead
        );
    }

    public async Task<bool> MarkAsReadAsync(Guid messageId)
    {
        var message = await _context.Messages.FindAsync(messageId);
        if (message == null)
            return false;

        message.IsRead = true;
        _context.Messages.Update(message);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMessageAsync(Guid messageId, Guid userId)
    {
        var message = await _context.Messages.FindAsync(messageId);
        if (message == null || message.SenderId != userId)
            return false;

        _context.Messages.Remove(message);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetUnreadMessageCountAsync(Guid userId)
    {
        return await _context.Messages
            .CountAsync(m => m.ReceiverId == userId && !m.IsRead);
    }
}
