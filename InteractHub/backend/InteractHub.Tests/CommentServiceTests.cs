using Moq;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.DTOs.Post_Interactions;

namespace InteractHub.Tests;

public class CommentServiceTests
{
    private readonly Mock<IGenericRepository<Comment>> _mockCommentRepo;
    private readonly Mock<IGenericRepository<Post>> _mockPostRepo;
    private readonly CommentService _commentService;

    public CommentServiceTests()
    {
        _mockCommentRepo = new Mock<IGenericRepository<Comment>>();
        _mockPostRepo = new Mock<IGenericRepository<Post>>();
        _commentService = new CommentService(_mockCommentRepo.Object, _mockPostRepo.Object);
    }

    #region GetCommentsByPostIdAsync Tests

    [Fact]
    public async Task GetCommentsByPostIdAsync_WithNoComments_ReturnsEmptyList()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var comments = new List<Comment>();

        _mockCommentRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(comments);

        // Act
        var result = await _commentService.GetCommentsByPostIdAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetCommentsByPostIdAsync_WithMultipleComments_ReturnsOrderedByCreatedAt()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        var comments = new List<Comment>
        {
            new Comment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                Content = "First comment",
                CreatedAt = now.AddMinutes(-10),
                DeletedAt = null
            },
            new Comment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                Content = "Second comment",
                CreatedAt = now.AddMinutes(-5),
                DeletedAt = null
            },
            new Comment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                Content = "Third comment",
                CreatedAt = now,
                DeletedAt = null
            }
        };

        _mockCommentRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(comments);

        // Act
        var result = await _commentService.GetCommentsByPostIdAsync(postId);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(3, resultList.Count);
        Assert.Equal("Third comment", resultList[0].Content);
        Assert.Equal("Second comment", resultList[1].Content);
        Assert.Equal("First comment", resultList[2].Content);
    }

    [Fact]
    public async Task GetCommentsByPostIdAsync_IgnoresDeletedComments()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        var comments = new List<Comment>
        {
            new Comment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                Content = "Active comment",
                CreatedAt = now,
                DeletedAt = null
            },
            new Comment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                Content = "Deleted comment",
                CreatedAt = now.AddMinutes(-5),
                DeletedAt = now.AddMinutes(-1)
            }
        };

        _mockCommentRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(comments);

        // Act
        var result = await _commentService.GetCommentsByPostIdAsync(postId);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Single(resultList);
        Assert.Equal("Active comment", resultList[0].Content);
    }

    [Fact]
    public async Task GetCommentsByPostIdAsync_IgnoresCommentsFromOtherPosts()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var otherPostId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var comments = new List<Comment>
        {
            new Comment
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                Content = "Comment for post 1",
                CreatedAt = DateTime.UtcNow,
                DeletedAt = null
            },
            new Comment
            {
                Id = Guid.NewGuid(),
                PostId = otherPostId,
                UserId = userId,
                Content = "Comment for post 2",
                CreatedAt = DateTime.UtcNow,
                DeletedAt = null
            }
        };

        _mockCommentRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(comments);

        // Act
        var result = await _commentService.GetCommentsByPostIdAsync(postId);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Single(resultList);
        Assert.Equal("Comment for post 1", resultList[0].Content);
    }

    #endregion

    #region AddCommentAsync Tests

    [Fact]
    public async Task AddCommentAsync_WithValidPost_CreatesComment()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var request = new CreateCommentDTO { PostId = postId, Content = "Test comment" };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockCommentRepo.Setup(r => r.AddAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
        _mockCommentRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _commentService.AddCommentAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(postId, result.PostId);
        Assert.Equal(userId, result.UserId);
        Assert.Equal("Test comment", result.Content);
        _mockCommentRepo.Verify(r => r.AddAsync(It.IsAny<Comment>()), Times.Once);
        _mockCommentRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task AddCommentAsync_WithDeletedPost_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.deleted, UserId = Guid.NewGuid() };
        var request = new CreateCommentDTO { PostId = postId, Content = "Test comment" };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _commentService.AddCommentAsync(userId, request));
    }

    [Fact]
    public async Task AddCommentAsync_WithNullPost_ThrowsException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var request = new CreateCommentDTO { PostId = postId, Content = "Test comment" };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync((Post?)null);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _commentService.AddCommentAsync(userId, request));
    }

    [Fact]
    public async Task AddCommentAsync_WithEmptyContent_StillCreatesComment()
    {
        // Arrange - Testing edge case where content is empty string
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var request = new CreateCommentDTO { PostId = postId, Content = "" };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockCommentRepo.Setup(r => r.AddAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
        _mockCommentRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _commentService.AddCommentAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("", result.Content);
    }

    [Fact]
    public async Task AddCommentAsync_WithLongContent_CreatesComment()
    {
        // Arrange - Testing with maximum length content
        var userId = Guid.NewGuid();
        var postId = Guid.NewGuid();
        var post = new Post { Id = postId, Status = Status.active, UserId = Guid.NewGuid() };
        var longContent = new string('a', 1000);
        var request = new CreateCommentDTO { PostId = postId, Content = longContent };

        _mockPostRepo.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
        _mockCommentRepo.Setup(r => r.AddAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
        _mockCommentRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _commentService.AddCommentAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(longContent, result.Content);
    }

    #endregion

    #region DeleteCommentAsync Tests

    [Fact]
    public async Task DeleteCommentAsync_WithValidComment_MarkAsDeleted()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            UserId = userId,
            PostId = Guid.NewGuid(),
            Content = "Test comment",
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        _mockCommentRepo.Setup(r => r.GetByIdAsync(commentId)).ReturnsAsync(comment);
        _mockCommentRepo.Setup(r => r.Update(It.IsAny<Comment>()));
        _mockCommentRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _commentService.DeleteCommentAsync(commentId, userId);

        // Assert
        Assert.True(result);
        _mockCommentRepo.Verify(r => r.Update(It.Is<Comment>(c =>
            c.Id == commentId &&
            c.DeletedAt != null
        )), Times.Once);
        _mockCommentRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteCommentAsync_WithWrongUser_ReturnsFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            UserId = userId,
            PostId = Guid.NewGuid(),
            Content = "Test comment",
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        _mockCommentRepo.Setup(r => r.GetByIdAsync(commentId)).ReturnsAsync(comment);

        // Act
        var result = await _commentService.DeleteCommentAsync(commentId, differentUserId);

        // Assert
        Assert.False(result);
        _mockCommentRepo.Verify(r => r.Update(It.IsAny<Comment>()), Times.Never);
    }

    [Fact]
    public async Task DeleteCommentAsync_WithNullComment_ReturnsFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var commentId = Guid.NewGuid();

        _mockCommentRepo.Setup(r => r.GetByIdAsync(commentId)).ReturnsAsync((Comment?)null);

        // Act
        var result = await _commentService.DeleteCommentAsync(commentId, userId);

        // Assert
        Assert.False(result);
        _mockCommentRepo.Verify(r => r.Update(It.IsAny<Comment>()), Times.Never);
    }

    [Fact]
    public async Task DeleteCommentAsync_WithAlreadyDeletedComment_ReturnsFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var commentId = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId,
            UserId = userId,
            PostId = Guid.NewGuid(),
            Content = "Test comment",
            CreatedAt = DateTime.UtcNow,
            DeletedAt = DateTime.UtcNow.AddMinutes(-5)
        };

        _mockCommentRepo.Setup(r => r.GetByIdAsync(commentId)).ReturnsAsync(comment);

        // Act
        var result = await _commentService.DeleteCommentAsync(commentId, userId);

        // Assert
        Assert.False(result);
        _mockCommentRepo.Verify(r => r.Update(It.IsAny<Comment>()), Times.Never);
    }

    [Fact]
    public async Task DeleteCommentAsync_WithMultipleComments_DeletesOnlyTargetComment()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var commentId1 = Guid.NewGuid();
        var commentId2 = Guid.NewGuid();
        var comment = new Comment
        {
            Id = commentId1,
            UserId = userId,
            PostId = Guid.NewGuid(),
            Content = "Comment 1",
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        _mockCommentRepo.Setup(r => r.GetByIdAsync(commentId1)).ReturnsAsync(comment);
        _mockCommentRepo.Setup(r => r.Update(It.IsAny<Comment>()));
        _mockCommentRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _commentService.DeleteCommentAsync(commentId1, userId);

        // Assert
        Assert.True(result);
        _mockCommentRepo.Verify(r => r.Update(It.Is<Comment>(c =>
            c.Id == commentId1
        )), Times.Once);
    }

    #endregion
}
