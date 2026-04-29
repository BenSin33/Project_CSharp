namespace InteractHub.Api.DTOs;

// DTO để tạo tin nhắn mới
public record CreateMessageDTO(
    string MessageContent,
    Guid ReceiverId
);

// DTO để hiển thị tin nhắn
public record MessageResponseDTO(
    Guid Id,
    string? MessageContent,
    Guid SenderId,
    string SenderName,
    string? SenderAvatar,
    Guid ReceiverId,
    string ReceiverName,
    string? ReceiverAvatar,
    DateTime SentAt,
    bool IsRead
);

// DTO để hiển thị danh sách cuộc hội thoại
public record ConversationDTO(
    Guid UserId,
    string UserName,
    string? UserAvatar,
    string? LastMessage,
    DateTime LastMessageTime,
    int UnreadCount
);

// DTO để đánh dấu tin nhắn đã đọc
public record MarkMessageAsReadDTO(Guid MessageId);
