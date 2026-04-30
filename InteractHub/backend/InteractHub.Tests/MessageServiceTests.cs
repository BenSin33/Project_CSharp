using Microsoft.EntityFrameworkCore;
using Xunit;
using InteractHub.Api.Data;
using InteractHub.Api.DTOs;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Implementation;

namespace InteractHub.Tests;

public class MessageServiceTests
{
    private static ApplicationDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new ApplicationDbContext(options);
    }

    private static User CreateUser(Guid id, string name)
    {
        return new User
        {
            Id = id,
            Email = $"{name}@example.com",
            UserName = $"{name}@example.com",
            FullName = name
        };
    }

    [Fact]
    public async Task SendMessageAsync_ReceiverMissing_ThrowsArgumentException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var senderId = Guid.NewGuid();
        var dto = new CreateMessageDTO("Hi", Guid.NewGuid());

        await Assert.ThrowsAsync<ArgumentException>(() => service.SendMessageAsync(dto, senderId));
    }

    [Fact]
    public async Task SendMessageAsync_SenderMissing_ThrowsArgumentException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var receiver = CreateUser(Guid.NewGuid(), "receiver");
        context.Users.Add(receiver);
        await context.SaveChangesAsync();

        var dto = new CreateMessageDTO("Hi", receiver.Id);

        await Assert.ThrowsAsync<ArgumentException>(() => service.SendMessageAsync(dto, Guid.NewGuid()));
    }

    [Fact]
    public async Task SendMessageAsync_ValidRequest_PersistsAndReturnsResponse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var sender = CreateUser(Guid.NewGuid(), "sender");
        var receiver = CreateUser(Guid.NewGuid(), "receiver");
        context.Users.AddRange(sender, receiver);
        await context.SaveChangesAsync();

        var dto = new CreateMessageDTO("Hello", receiver.Id);

        var result = await service.SendMessageAsync(dto, sender.Id);

        Assert.Equal("Hello", result.MessageContent);
        Assert.Equal(sender.Id, result.SenderId);
        Assert.Equal(receiver.Id, result.ReceiverId);
        Assert.False(result.IsRead);
        Assert.Single(context.Messages);
    }

    [Fact]
    public async Task GetConversationAsync_ReturnsOrderedMessages()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var userA = CreateUser(Guid.NewGuid(), "userA");
        var userB = CreateUser(Guid.NewGuid(), "userB");
        context.Users.AddRange(userA, userB);

        var msg1 = new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "1", SentAt = DateTime.UtcNow.AddMinutes(-5) };
        var msg2 = new Message { SenderId = userB.Id, ReceiverId = userA.Id, MessageContent = "2", SentAt = DateTime.UtcNow.AddMinutes(-1) };
        context.Messages.AddRange(msg1, msg2);
        await context.SaveChangesAsync();

        var result = await service.GetConversationAsync(userA.Id, userB.Id);

        Assert.Equal(2, result.Count);
        Assert.Equal("1", result[0].MessageContent);
        Assert.Equal("2", result[1].MessageContent);
    }

    [Fact]
    public async Task GetConversationsAsync_ReturnsLatestPerUserWithUnreadCount()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var userA = CreateUser(Guid.NewGuid(), "userA");
        var userB = CreateUser(Guid.NewGuid(), "userB");
        var userC = CreateUser(Guid.NewGuid(), "userC");
        context.Users.AddRange(userA, userB, userC);

        var messages = new List<Message>
        {
            new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "hi", SentAt = DateTime.UtcNow.AddMinutes(-10), IsRead = false },
            new Message { SenderId = userB.Id, ReceiverId = userA.Id, MessageContent = "reply", SentAt = DateTime.UtcNow.AddMinutes(-5), IsRead = true },
            new Message { SenderId = userC.Id, ReceiverId = userA.Id, MessageContent = "yo", SentAt = DateTime.UtcNow.AddMinutes(-2), IsRead = false }
        };

        context.Messages.AddRange(messages);
        await context.SaveChangesAsync();

        var result = await service.GetConversationsAsync(userA.Id);

        Assert.Equal(2, result.Count);
        var convWithC = result.First(c => c.UserId == userC.Id);
        Assert.Equal(1, convWithC.UnreadCount);
    }

    [Fact]
    public async Task GetMessageByIdAsync_NotFound_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var result = await service.GetMessageByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetMessageByIdAsync_Found_ReturnsDto()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var userA = CreateUser(Guid.NewGuid(), "userA");
        var userB = CreateUser(Guid.NewGuid(), "userB");
        context.Users.AddRange(userA, userB);

        var message = new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "hello" };
        context.Messages.Add(message);
        await context.SaveChangesAsync();

        var result = await service.GetMessageByIdAsync(message.Id);

        Assert.NotNull(result);
        Assert.Equal("hello", result?.MessageContent);
    }

    [Fact]
    public async Task MarkAsReadAsync_MessageMissing_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var result = await service.MarkAsReadAsync(Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task MarkAsReadAsync_ValidMessage_SetsIsRead()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var userA = CreateUser(Guid.NewGuid(), "userA");
        var userB = CreateUser(Guid.NewGuid(), "userB");
        context.Users.AddRange(userA, userB);

        var message = new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "m" };
        context.Messages.Add(message);
        await context.SaveChangesAsync();

        var result = await service.MarkAsReadAsync(message.Id);

        Assert.True(result);
        var updated = await context.Messages.FindAsync(message.Id);
        Assert.True(updated?.IsRead);
    }

    [Fact]
    public async Task DeleteMessageAsync_NotSender_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var userA = CreateUser(Guid.NewGuid(), "userA");
        var userB = CreateUser(Guid.NewGuid(), "userB");
        context.Users.AddRange(userA, userB);

        var message = new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "m" };
        context.Messages.Add(message);
        await context.SaveChangesAsync();

        var result = await service.DeleteMessageAsync(message.Id, userB.Id);

        Assert.False(result);
        Assert.Single(context.Messages);
    }

    [Fact]
    public async Task DeleteMessageAsync_SenderDeletes_RemovesMessage()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var userA = CreateUser(Guid.NewGuid(), "userA");
        var userB = CreateUser(Guid.NewGuid(), "userB");
        context.Users.AddRange(userA, userB);

        var message = new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "m" };
        context.Messages.Add(message);
        await context.SaveChangesAsync();

        var result = await service.DeleteMessageAsync(message.Id, userA.Id);

        Assert.True(result);
        Assert.Empty(context.Messages);
    }

    [Fact]
    public async Task GetUnreadMessageCountAsync_ReturnsCount()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateDbContext(dbName);
        var service = new MessageService(context);

        var userA = CreateUser(Guid.NewGuid(), "userA");
        var userB = CreateUser(Guid.NewGuid(), "userB");
        context.Users.AddRange(userA, userB);

        var messages = new List<Message>
        {
            new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "1", IsRead = false },
            new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "2", IsRead = true },
            new Message { SenderId = userA.Id, ReceiverId = userB.Id, MessageContent = "3", IsRead = false }
        };

        context.Messages.AddRange(messages);
        await context.SaveChangesAsync();

        var result = await service.GetUnreadMessageCountAsync(userB.Id);

        Assert.Equal(2, result);
    }
}
