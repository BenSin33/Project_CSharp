using Moq;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.DTOs.Post_Interactions;

namespace InteractHub.Tests;

public class LikeServiceTests : TestBase
{
    private readonly Mock<IGenericRepository<Like>> _mockLikeRepo;
    private readonly Mock<IGenericRepository<Post>> _mockPostRepo;
    private readonly LikeService _likeService;

    public LikeServiceTests()
    {
        _mockLikeRepo = new Mock<IGenericRepository<Like>>();
        _mockPostRepo = new Mock<IGenericRepository<Post>>();
        _likeService = new LikeService(_mockLikeRepo.Object, _mockPostRepo.Object, CreateDbContext(), CreateNotificationServiceMock().Object);
    }

    #region GetLikeSummaryAsync Tests

    [Fact]
    public async Task GetLikeSummaryAsync_WithNoLikes_ReturnsZeroCount()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var likes = new List<Like>();

        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(likes);

        // Act
        var result = await _likeService.GetLikeSummaryAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.TotalLikes);
        Assert.Empty(result.ReactionCounts);
        Assert.Null(result.CurrentUserReaction);
    }

    [Fact]
    public async Task GetLikeSummaryAsync_WithMultipleLikes_ReturnsCounts()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var userId3 = Guid.NewGuid();

        var likes = new List<Like>
        {
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = userId1, Type = LikeType.LIKE, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = userId2, Type = LikeType.LOVE, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = userId3, Type = LikeType.LIKE, CreatedAt = DateTime.UtcNow }
        };

        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(likes);

        // Act
        var result = await _likeService.GetLikeSummaryAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalLikes);
        Assert.Equal(2, result.ReactionCounts["LIKE"]);
        Assert.Equal(1, result.ReactionCounts["LOVE"]);
        Assert.Null(result.CurrentUserReaction);
    }

    [Fact]
    public async Task GetLikeSummaryAsync_WithCurrentUserId_ReturnsCurrentUserReaction()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var currentUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        var likes = new List<Like>
        {
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = currentUserId, Type = LikeType.LOVE, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = otherUserId, Type = LikeType.LIKE, CreatedAt = DateTime.UtcNow }
        };

        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(likes);

        // Act
        var result = await _likeService.GetLikeSummaryAsync(postId, currentUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalLikes);
        Assert.Equal(LikeType.LOVE, result.CurrentUserReaction);
    }

    [Fact]
    public async Task GetLikeSummaryAsync_WithMultipleReactionTypes_ReturnsAllReactionCounts()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var likes = new List<Like>
        {
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), Type = LikeType.LIKE, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), Type = LikeType.LOVE, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), Type = LikeType.HAHA, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), Type = LikeType.WOW, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), Type = LikeType.SAD, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), Type = LikeType.ANGRY, CreatedAt = DateTime.UtcNow }
        };

        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(likes);

        // Act
        var result = await _likeService.GetLikeSummaryAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(6, result.TotalLikes);
        Assert.Equal(1, result.ReactionCounts["LIKE"]);
        Assert.Equal(1, result.ReactionCounts["LOVE"]);
        Assert.Equal(1, result.ReactionCounts["HAHA"]);
        Assert.Equal(1, result.ReactionCounts["WOW"]);
        Assert.Equal(1, result.ReactionCounts["SAD"]);
        Assert.Equal(1, result.ReactionCounts["ANGRY"]);
    }

    [Fact]
    public async Task GetLikeSummaryAsync_IgnoresLikesFromOtherPosts()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var otherPostId = Guid.NewGuid();

        var likes = new List<Like>
        {
            new Like { Id = Guid.NewGuid(), PostId = postId, UserId = Guid.NewGuid(), Type = LikeType.LIKE, CreatedAt = DateTime.UtcNow },
            new Like { Id = Guid.NewGuid(), PostId = otherPostId, UserId = Guid.NewGuid(), Type = LikeType.LOVE, CreatedAt = DateTime.UtcNow }
        };

        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(likes);

        // Act
        var result = await _likeService.GetLikeSummaryAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalLikes);
        Assert.Single(result.ReactionCounts);
    }

    #endregion

    #region ToggleLikeAsync Tests

    [Fact]
    public async Task ToggleLikeAsync_WithValidPost_AddsNewLike()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var request = new ToggleLikeDTO { PostId = postId, Type = LikeType.LIKE };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Like>());
        _mockLikeRepo.Setup(r => r.AddAsync(It.IsAny<Like>())).Returns(Task.CompletedTask);
        _mockLikeRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _likeService.ToggleLikeAsync(userId, request);

        // Assert
        Assert.True(result);
        _mockLikeRepo.Verify(r => r.AddAsync(It.Is<Like>(l =>
            l.UserId == userId &&
            l.PostId == postId &&
            l.Type == LikeType.LIKE
        )), Times.Once);
        _mockLikeRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ToggleLikeAsync_WithDeletedPost_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.deleted, UserId = Guid.NewGuid() };
        var request = new ToggleLikeDTO { PostId = postId, Type = LikeType.LIKE };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _likeService.ToggleLikeAsync(userId, request));
    }

    [Fact]
    public async Task ToggleLikeAsync_WithNullPost_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var request = new ToggleLikeDTO { PostId = postId, Type = LikeType.LIKE };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync((Post?)null);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _likeService.ToggleLikeAsync(userId, request));
    }

    [Fact]
    public async Task ToggleLikeAsync_WithExistingSameLike_DeletesLike()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var existingLike = new Like { Id = Guid.NewGuid(), UserId = userId, PostId = postId, Type = LikeType.LIKE };
        var request = new ToggleLikeDTO { PostId = postId, Type = LikeType.LIKE };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Like> { existingLike });
        _mockLikeRepo.Setup(r => r.Delete(existingLike));
        _mockLikeRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _likeService.ToggleLikeAsync(userId, request);

        // Assert
        Assert.True(result);
        _mockLikeRepo.Verify(r => r.Delete(existingLike), Times.Once);
        _mockLikeRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ToggleLikeAsync_WithExistingDifferentLike_UpdatesLike()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var existingLike = new Like
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PostId = postId,
            Type = LikeType.LIKE,
            UpdatedAt = DateTime.UtcNow
        };
        var request = new ToggleLikeDTO { PostId = postId, Type = LikeType.LOVE };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Like> { existingLike });
        _mockLikeRepo.Setup(r => r.Update(It.IsAny<Like>()));
        _mockLikeRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _likeService.ToggleLikeAsync(userId, request);

        // Assert
        Assert.True(result);
        _mockLikeRepo.Verify(r => r.Update(It.Is<Like>(l =>
            l.Id == existingLike.Id &&
            l.Type == LikeType.LOVE
        )), Times.Once);
        _mockLikeRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ToggleLikeAsync_WithDifferentUserLikes_HandlesIndependently()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var otherUserLike = new Like { Id = Guid.NewGuid(), UserId = otherUserId, PostId = postId, Type = LikeType.LIKE };
        var request = new ToggleLikeDTO { PostId = postId, Type = LikeType.LOVE };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockLikeRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Like> { otherUserLike });
        _mockLikeRepo.Setup(r => r.AddAsync(It.IsAny<Like>())).Returns(Task.CompletedTask);
        _mockLikeRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _likeService.ToggleLikeAsync(userId, request);

        // Assert
        Assert.True(result);
        _mockLikeRepo.Verify(r => r.AddAsync(It.Is<Like>(l =>
            l.UserId == userId &&
            l.PostId == postId
        )), Times.Once);
    }

    #endregion
}
