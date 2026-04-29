using InteractHub.Api.DTOs;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services.Interface;

public interface IMessageService
{
    // Gửi tin nhắn
    Task<MessageResponseDTO> SendMessageAsync(CreateMessageDTO createMessageDto, Guid senderId);
    
    // Lấy tin nhắn giữa 2 user (đoạn chat)
    Task<List<MessageResponseDTO>> GetConversationAsync(Guid userId, Guid otherUserId);
    
    // Lấy danh sách cuộc hội thoại (conversation list)
    Task<List<ConversationDTO>> GetConversationsAsync(Guid userId);
    
    // Lấy tin nhắn theo ID
    Task<MessageResponseDTO?> GetMessageByIdAsync(Guid messageId);
    
    // Đánh dấu tin nhắn đã đọc
    Task<bool> MarkAsReadAsync(Guid messageId);
    
    // Xóa tin nhắn
    Task<bool> DeleteMessageAsync(Guid messageId, Guid userId);
    
    // Lấy số tin nhắn chưa đọc
    Task<int> GetUnreadMessageCountAsync(Guid userId);
}
