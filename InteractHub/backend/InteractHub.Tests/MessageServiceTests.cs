using Moq;
using Xunit;
using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Data;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs;
using InteractHub.Api.Services.Implementation;

namespace InteractHub.Tests;

public class MessageServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly MessageService _messageService;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();

    public MessageServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _messageService = new MessageService(_context);

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        var user1 = new User
        {
            Id = _userId,
            UserName = "user1@test.com",
            Email = "user1@test.com",
            FullName = "User One",
            AvatarUrl = "https://example.com/avatar1.jpg"
        };

        var user2 = new User
        {
            Id = _otherUserId,
            UserName = "user2@test.com",
            Email = "user2@test.com",
            FullName = "User Two",
            AvatarUrl = "https://example.com/avatar2.jpg"
        };

        _context.Users.AddRange(user1, user2);
        _context.SaveChanges();
    }

    [Fact]
    public async Task SendMessageAsync_ValidData_ReturnMessageResponseDTO()
    {
        // Arrange
        var createMessageDto = new CreateMessageDTO("Hello World", _otherUserId);

        // Act
        var result = await _messageService.SendMessageAsync(createMessageDto, _userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Hello World", result.MessageContent);
        Assert.Equal(_userId, result.SenderId);
        Assert.Equal(_otherUserId, result.ReceiverId);
        Assert.False(result.IsRead);
    }

    [Fact]
    public async Task SendMessageAsync_InvalidReceiver_ThrowsException()
    {
        // Arrange
        var invalidUserId = Guid.NewGuid();
        var createMessageDto = new CreateMessageDTO("Hello", invalidUserId);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _messageService.SendMessageAsync(createMessageDto, _userId)
        );
    }

    [Fact]
    public async Task GetConversationAsync_ExistingConversation_ReturnListOfMessages()
    {
        // Arrange - Gửi 2 tin nhắn
        var message1Dto = new CreateMessageDTO("First message", _otherUserId);
        var message2Dto = new CreateMessageDTO("Second message", _otherUserId);

        await _messageService.SendMessageAsync(message1Dto, _userId);
        await _messageService.SendMessageAsync(message2Dto, _userId);

        // Act
        var conversation = await _messageService.GetConversationAsync(_userId, _otherUserId);

        // Assert
        Assert.NotEmpty(conversation);
        Assert.Equal(2, conversation.Count);
        Assert.Equal("First message", conversation[0].MessageContent);
        Assert.Equal("Second message", conversation[1].MessageContent);
    }

    [Fact]
    public async Task GetConversationsAsync_MultipleConversations_ReturnConversationList()
    {
        // Arrange
        var userId3 = Guid.NewGuid();
        var user3 = new User
        {
            Id = userId3,
            UserName = "user3@test.com",
            Email = "user3@test.com",
            FullName = "User Three",
            AvatarUrl = "https://example.com/avatar3.jpg"
        };
        _context.Users.Add(user3);
        _context.SaveChanges();

        await _messageService.SendMessageAsync(
            new CreateMessageDTO("Message to User 2", _otherUserId),
            _userId
        );

        await _messageService.SendMessageAsync(
            new CreateMessageDTO("Message to User 3", userId3),
            _userId
        );

        // Act
        var conversations = await _messageService.GetConversationsAsync(_userId);

        // Assert
        Assert.NotEmpty(conversations);
        Assert.Equal(2, conversations.Count);
    }

    [Fact]
    public async Task MarkAsReadAsync_ValidMessageId_ReturnsTrue()
    {
        // Arrange
        var messageDto = new CreateMessageDTO("Test message", _otherUserId);
        var message = await _messageService.SendMessageAsync(messageDto, _userId);

        // Act
        var result = await _messageService.MarkAsReadAsync(message.Id);

        // Assert
        Assert.True(result);

        var updatedMessage = await _messageService.GetMessageByIdAsync(message.Id);
        Assert.True(updatedMessage?.IsRead);
    }

    [Fact]
    public async Task MarkAsReadAsync_InvalidMessageId_ReturnsFalse()
    {
        // Act
        var result = await _messageService.MarkAsReadAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteMessageAsync_MessageOwner_ReturnsTrue()
    {
        // Arrange
        var messageDto = new CreateMessageDTO("Test message", _otherUserId);
        var message = await _messageService.SendMessageAsync(messageDto, _userId);

        // Act
        var result = await _messageService.DeleteMessageAsync(message.Id, _userId);

        // Assert
        Assert.True(result);

        var deletedMessage = await _messageService.GetMessageByIdAsync(message.Id);
        Assert.Null(deletedMessage);
    }

    [Fact]
    public async Task DeleteMessageAsync_NotMessageOwner_ReturnsFalse()
    {
        // Arrange
        var messageDto = new CreateMessageDTO("Test message", _otherUserId);
        var message = await _messageService.SendMessageAsync(messageDto, _userId);

        // Act - cố gắng xóa tin nhắn của user khác
        var result = await _messageService.DeleteMessageAsync(message.Id, _otherUserId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetUnreadMessageCountAsync_MultipleUnreadMessages_ReturnCorrectCount()
    {
        // Arrange
        await _messageService.SendMessageAsync(
            new CreateMessageDTO("Unread 1", _otherUserId),
            _userId
        );

        await _messageService.SendMessageAsync(
            new CreateMessageDTO("Unread 2", _otherUserId),
            _userId
        );

        // Act
        var count = await _messageService.GetUnreadMessageCountAsync(_otherUserId);

        // Assert
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task GetMessageByIdAsync_ValidMessageId_ReturnMessageResponseDTO()
    {
        // Arrange
        var messageDto = new CreateMessageDTO("Test message", _otherUserId);
        var createdMessage = await _messageService.SendMessageAsync(messageDto, _userId);

        // Act
        var result = await _messageService.GetMessageByIdAsync(createdMessage.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test message", result.MessageContent);
        Assert.Equal(_userId, result.SenderId);
    }

    [Fact]
    public async Task GetMessageByIdAsync_InvalidMessageId_ReturnNull()
    {
        // Act
        var result = await _messageService.GetMessageByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}
