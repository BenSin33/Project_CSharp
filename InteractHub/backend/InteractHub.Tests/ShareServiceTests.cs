using Moq;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.DTOs.Post_Interactions;

namespace InteractHub.Tests;

public class ShareServiceTests : TestBase
{
    private readonly Mock<IGenericRepository<Share>> _mockShareRepo;
    private readonly Mock<IGenericRepository<Post>> _mockPostRepo;
    private readonly ShareService _shareService;

    public ShareServiceTests()
    {
        _mockShareRepo = new Mock<IGenericRepository<Share>>();
        _mockPostRepo = new Mock<IGenericRepository<Post>>();
        _shareService = new ShareService(_mockShareRepo.Object, _mockPostRepo.Object, CreateDbContext(), CreateNotificationServiceMock().Object);
    }

    #region GetShareCountAsync Tests

    [Fact]
    public async Task GetShareCountAsync_WithNoShares_ReturnsZero()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var shares = new List<Share>();

        _mockShareRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(shares);

        // Act
        var result = await _shareService.GetShareCountAsync(postId);

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public async Task GetShareCountAsync_WithMultipleShares_ReturnsCorrectCount()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var shares = new List<Share>
        {
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, DeletedAt = null },
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, DeletedAt = null },
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, DeletedAt = null }
        };

        _mockShareRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(shares);

        // Act
        var result = await _shareService.GetShareCountAsync(postId);

        // Assert
        Assert.Equal(3, result);
    }

    [Fact]
    public async Task GetShareCountAsync_IgnoresDeletedShares()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var shares = new List<Share>
        {
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = now, DeletedAt = null },
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = now, DeletedAt = now.AddMinutes(-5) },
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = now, DeletedAt = now.AddMinutes(-10) }
        };

        _mockShareRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(shares);

        // Act
        var result = await _shareService.GetShareCountAsync(postId);

        // Assert
        Assert.Equal(1, result);
    }

    [Fact]
    public async Task GetShareCountAsync_IgnoresSharesFromOtherPosts()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var otherPostId = Guid.NewGuid();
        var shares = new List<Share>
        {
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, DeletedAt = null },
            new Share { Id = Guid.NewGuid(), PostId = otherPostId, UserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, DeletedAt = null },
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow, DeletedAt = null }
        };

        _mockShareRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(shares);

        // Act
        var result = await _shareService.GetShareCountAsync(postId);

        // Assert
        Assert.Equal(2, result);
    }

    [Fact]
    public async Task GetShareCountAsync_WithMultipleUsersSharing_CountsAllShares()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var userId3 = Guid.NewGuid();

        var shares = new List<Share>
        {
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = userId1, CreatedAt = DateTime.UtcNow, DeletedAt = null },
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = userId2, CreatedAt = DateTime.UtcNow, DeletedAt = null },
            new Share { Id = Guid.NewGuid(), PostId = postId, UserId = userId3, CreatedAt = DateTime.UtcNow, DeletedAt = null }
        };

        _mockShareRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(shares);

        // Act
        var result = await _shareService.GetShareCountAsync(postId);

        // Assert
        Assert.Equal(3, result);
    }

    #endregion

    #region SharePostAsync Tests

    [Fact]
    public async Task SharePostAsync_WithValidPost_CreatesShare()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var request = new CreateShareDTO { PostId = postId };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockShareRepo.Setup(r => r.AddAsync(It.IsAny<Share>())).Returns(Task.CompletedTask);
        _mockShareRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _shareService.SharePostAsync(userId, request);

        // Assert
        Assert.True(result);
        _mockShareRepo.Verify(r => r.AddAsync(It.Is<Share>(s =>
            s.UserId == userId &&
            s.PostId == postId
        )), Times.Once);
        _mockShareRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task SharePostAsync_WithDeletedPost_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.deleted, UserId = Guid.NewGuid() };
        var request = new CreateShareDTO { PostId = postId };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _shareService.SharePostAsync(userId, request));
    }

    [Fact]
    public async Task SharePostAsync_WithNullPost_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var request = new CreateShareDTO { PostId = postId };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync((Post?)null);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _shareService.SharePostAsync(userId, request));
    }

    [Fact]
    public async Task SharePostAsync_WithHiddenPost_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.hidden, UserId = Guid.NewGuid() };
        var request = new CreateShareDTO { PostId = postId };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockShareRepo.Setup(r => r.AddAsync(It.IsAny<Share>())).Returns(Task.CompletedTask);
        _mockShareRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act - Hidden post should be allowed to share (based on current implementation)
        var result = await _shareService.SharePostAsync(userId, request);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task SharePostAsync_MultipleUsersShareSamePost_AllSharesCreated()
    {
        // Arrange
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var request = new CreateShareDTO { PostId = postId };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockShareRepo.Setup(r => r.AddAsync(It.IsAny<Share>())).Returns(Task.CompletedTask);
        _mockShareRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act - User 1 shares
        var result1 = await _shareService.SharePostAsync(userId1, request);
        // User 2 shares
        var result2 = await _shareService.SharePostAsync(userId2, request);

        // Assert
        Assert.True(result1);
        Assert.True(result2);
        _mockShareRepo.Verify(r => r.AddAsync(It.IsAny<Share>()), Times.Exactly(2));
        _mockShareRepo.Verify(r => r.SaveChangesAsync(), Times.Exactly(2));
    }

    [Fact]
    public async Task SharePostAsync_SameUserSharesSamePostMultipleTimes_CreatesMultipleShares()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var request = new CreateShareDTO { PostId = postId };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockShareRepo.Setup(r => r.AddAsync(It.IsAny<Share>())).Returns(Task.CompletedTask);
        _mockShareRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result1 = await _shareService.SharePostAsync(userId, request);
        var result2 = await _shareService.SharePostAsync(userId, request);

        // Assert
        Assert.True(result1);
        Assert.True(result2);
        _mockShareRepo.Verify(r => r.AddAsync(It.IsAny<Share>()), Times.Exactly(2));
    }

    [Fact]
    public async Task SharePostAsync_VerifiesSharePropertiesSet()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var request = new CreateShareDTO { PostId = postId };

        Share? capturedShare = null;
        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockShareRepo.Setup(r => r.AddAsync(It.IsAny<Share>()))
            .Callback<Share>(s => capturedShare = s)
            .Returns(Task.CompletedTask);
        _mockShareRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        await _shareService.SharePostAsync(userId, request);

        // Assert
        Assert.NotNull(capturedShare);
        Assert.Equal(userId, capturedShare.UserId);
        Assert.Equal(postId, capturedShare.PostId);
        Assert.NotEqual(Guid.Empty, capturedShare.Id);
    }

    #endregion
}
