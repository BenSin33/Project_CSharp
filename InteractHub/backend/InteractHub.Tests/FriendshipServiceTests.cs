using Moq;
using Xunit;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.DTOs.FriendshipDTO;

namespace InteractHub.Tests;

public class FriendshipServiceTests
{
    private readonly Mock<IGenericRepository<FriendShip>> _friendshipRepoMock;
    private readonly Mock<IGenericRepository<User>> _userRepoMock;
    private readonly FriendshipService _service;

    public FriendshipServiceTests()
    {
        _friendshipRepoMock = new Mock<IGenericRepository<FriendShip>>();
        _userRepoMock = new Mock<IGenericRepository<User>>();
        _service = new FriendshipService(_friendshipRepoMock.Object, _userRepoMock.Object);
    }

    [Fact]
    public async Task SendFriendRequestAsync_SameUser_Throws()
    {
        var userId = Guid.NewGuid();

        await Assert.ThrowsAsync<Exception>(() => _service.SendFriendRequestAsync(userId, userId));
    }

    [Fact]
    public async Task SendFriendRequestAsync_ExistingRelationship_Throws()
    {
        var requesterId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var existing = new FriendShip
        {
            Id = Guid.NewGuid(),
            RequesterId = requesterId,
            ReceiverId = receiverId,
            IsAccepted = IsAccepted.Pending,
            DeletedAt = null
        };

        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<FriendShip> { existing });

        await Assert.ThrowsAsync<Exception>(() => _service.SendFriendRequestAsync(requesterId, receiverId));
    }

    [Fact]
    public async Task SendFriendRequestAsync_ValidRequest_CreatesPending()
    {
        var requesterId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();

        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<FriendShip>());
        _friendshipRepoMock.Setup(r => r.AddAsync(It.IsAny<FriendShip>())).Returns(Task.CompletedTask);
        _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await _service.SendFriendRequestAsync(requesterId, receiverId);

        Assert.Equal("Pending", result.Status);
        _friendshipRepoMock.Verify(r => r.AddAsync(It.Is<FriendShip>(f =>
            f.RequesterId == requesterId &&
            f.ReceiverId == receiverId &&
            f.IsAccepted == IsAccepted.Pending
        )), Times.Once);
    }

    [Fact]
    public async Task AcceptFriendRequestAsync_NonReceiver_ReturnsFalse()
    {
        var receiverId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var friendshipId = Guid.NewGuid();
        var friendship = new FriendShip
        {
            Id = friendshipId,
            ReceiverId = receiverId,
            RequesterId = Guid.NewGuid(),
            IsAccepted = IsAccepted.Pending
        };

        _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);

        var result = await _service.AcceptFriendRequestAsync(friendshipId, otherUserId);

        Assert.False(result);
    }

    [Fact]
    public async Task AcceptFriendRequestAsync_ValidRequest_UpdatesStatus()
    {
        var receiverId = Guid.NewGuid();
        var friendshipId = Guid.NewGuid();
        var friendship = new FriendShip
        {
            Id = friendshipId,
            ReceiverId = receiverId,
            RequesterId = Guid.NewGuid(),
            IsAccepted = IsAccepted.Pending
        };

        _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);
        _friendshipRepoMock.Setup(r => r.Update(It.IsAny<FriendShip>()));
        _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await _service.AcceptFriendRequestAsync(friendshipId, receiverId);

        Assert.True(result);
        Assert.Equal(IsAccepted.Accepted, friendship.IsAccepted);
    }

    [Fact]
    public async Task RejectFriendRequestAsync_ValidRequest_UpdatesStatus()
    {
        var receiverId = Guid.NewGuid();
        var friendshipId = Guid.NewGuid();
        var friendship = new FriendShip
        {
            Id = friendshipId,
            ReceiverId = receiverId,
            RequesterId = Guid.NewGuid(),
            IsAccepted = IsAccepted.Pending
        };

        _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);
        _friendshipRepoMock.Setup(r => r.Update(It.IsAny<FriendShip>()));
        _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await _service.RejectFriendRequestAsync(friendshipId, receiverId);

        Assert.True(result);
        Assert.Equal(IsAccepted.Rejected, friendship.IsAccepted);
    }

    [Fact]
    public async Task GetFriendListAsync_ReturnsAcceptedFriends()
    {
        var userId = Guid.NewGuid();
        var friendId = Guid.NewGuid();

        var friendships = new List<FriendShip>
        {
            new FriendShip { RequesterId = userId, ReceiverId = friendId, IsAccepted = IsAccepted.Accepted, DeletedAt = null }
        };

        var users = new List<User>
        {
            new User { Id = friendId, FullName = "Friend", AvatarUrl = "avatar.png", Bio = "bio" }
        };

        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(friendships);
        _userRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);

        var result = (await _service.GetFriendListAsync(userId)).ToList();

        Assert.Single(result);
        Assert.Equal(friendId, result[0].Id);
    }

    [Fact]
    public async Task GetPendingRequestsAsync_ReturnsPendingWithRequesterInfo()
    {
        var userId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var friendshipId = Guid.NewGuid();

        var friendships = new List<FriendShip>
        {
            new FriendShip
            {
                Id = friendshipId,
                RequesterId = requesterId,
                ReceiverId = userId,
                IsAccepted = IsAccepted.Pending,
                DeletedAt = null,
                CreatedAt = DateTime.UtcNow
            }
        };

        var users = new List<User>
        {
            new User { Id = requesterId, FullName = "Requester", AvatarUrl = "a.png", Bio = "b" }
        };

        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(friendships);
        _userRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);

        var result = (await _service.GetPendingRequestsAsync(userId)).ToList();

        Assert.Single(result);
        Assert.Equal(friendshipId, result[0].Id);
        Assert.NotNull(result[0].Requester);
        Assert.Equal(requesterId, result[0].Requester!.Id);
    }

    [Fact]
    public async Task RemoveFriendAsync_NotParticipant_ReturnsFalse()
    {
        var friendshipId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var friendship = new FriendShip
        {
            Id = friendshipId,
            RequesterId = Guid.NewGuid(),
            ReceiverId = Guid.NewGuid()
        };

        _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);

        var result = await _service.RemoveFriendAsync(friendshipId, userId);

        Assert.False(result);
    }

    [Fact]
    public async Task CheckFriendshipStatusAsync_NoRelation_ReturnsNotFriends()
    {
        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<FriendShip>());

        var result = await _service.CheckFriendshipStatusAsync(Guid.NewGuid(), Guid.NewGuid());

        Assert.Equal("Not Friends", result);
    }

    [Fact]
    public async Task CheckFriendshipStatusAsync_Accepted_ReturnsAccepted()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var friendships = new List<FriendShip>
        {
            new FriendShip { RequesterId = userA, ReceiverId = userB, IsAccepted = IsAccepted.Accepted, DeletedAt = null }
        };

        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(friendships);

        var result = await _service.CheckFriendshipStatusAsync(userA, userB);

        Assert.Equal("Accepted", result);
    }

    [Fact]
    public async Task CheckFriendshipStatusAsync_PendingSent_ReturnsSent()
    {
        var requesterId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var friendships = new List<FriendShip>
        {
            new FriendShip { RequesterId = requesterId, ReceiverId = receiverId, IsAccepted = IsAccepted.Pending, DeletedAt = null }
        };

        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(friendships);

        var result = await _service.CheckFriendshipStatusAsync(requesterId, receiverId);

        Assert.Equal("Sent", result);
    }

    [Fact]
    public async Task CheckFriendshipStatusAsync_PendingReceived_ReturnsReceived()
    {
        var requesterId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var friendships = new List<FriendShip>
        {
            new FriendShip { RequesterId = requesterId, ReceiverId = receiverId, IsAccepted = IsAccepted.Pending, DeletedAt = null }
        };

        _friendshipRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(friendships);

        var result = await _service.CheckFriendshipStatusAsync(receiverId, requesterId);

        Assert.Equal("Received", result);
    }
}
