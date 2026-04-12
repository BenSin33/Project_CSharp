using Moq;
using Xunit;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.Post;
using InteractHub.Api.Repositories;

namespace InteractHub.Tests;

public class PostServiceTests
{
    private readonly Mock<IGenericRepository<Post>> _mockPostRepository;
    private readonly IPostService _postService;

    public PostServiceTests()
    {
        _mockPostRepository = new Mock<IGenericRepository<Post>>();
        _postService = new PostService(_mockPostRepository.Object);
    }

    #region GetAllActivePostsAsync Tests

    [Fact]
    public async Task GetAllActivePostsAsync_WithMultipleActivePosts_ReturnsAllActivePosts()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var activePosts = new List<Post>
        {
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Content = "First active post",
                Status = Status.active,
                Visibility = Visibility.Public,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Content = "Second active post",
                Status = Status.active,
                Visibility = Visibility.Friends,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockPostRepository
            .Setup(x => x.GetAllAsync())
            .ReturnsAsync(activePosts);

        // Act
        var result = await _postService.GetAllActivePostsAsync();

        // Assert
        Assert.NotNull(result);
        var posts = result.ToList();
        Assert.Equal(2, posts.Count);
        Assert.All(posts, post => Assert.Equal("active", post.Status));
        _mockPostRepository.Verify(x => x.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAllActivePostsAsync_WithMixedStatusPosts_ReturnsOnlyActivePosts()
    {
        // Arrange
        var mixedPosts = new List<Post>
        {
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Content = "Active post",
                Status = Status.active,
                Visibility = Visibility.Public,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Content = "Deleted post",
                Status = Status.deleted,
                Visibility = Visibility.Public,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Content = "Hidden post",
                Status = Status.hidden,
                Visibility = Visibility.Private,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockPostRepository
            .Setup(x => x.GetAllAsync())
            .ReturnsAsync(mixedPosts);

        // Act
        var result = await _postService.GetAllActivePostsAsync();

        // Assert
        var posts = result.ToList();
        Assert.Single(posts);
        Assert.Equal("Active post", posts[0].Content);
        Assert.Equal("active", posts[0].Status);
    }

    [Fact]
    public async Task GetAllActivePostsAsync_WithNoPosts_ReturnsEmptyList()
    {
        // Arrange
        _mockPostRepository
            .Setup(x => x.GetAllAsync())
            .ReturnsAsync(new List<Post>());

        // Act
        var result = await _postService.GetAllActivePostsAsync();

        // Assert
        Assert.Empty(result);
        _mockPostRepository.Verify(x => x.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAllActivePostsAsync_WithNoActivePosts_ReturnsEmptyList()
    {
        // Arrange
        var inactivePosts = new List<Post>
        {
            new Post
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Content = "Deleted post",
                Status = Status.deleted,
                Visibility = Visibility.Public,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _mockPostRepository
            .Setup(x => x.GetAllAsync())
            .ReturnsAsync(inactivePosts);

        // Act
        var result = await _postService.GetAllActivePostsAsync();

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region GetPostByIdAsync Tests

    [Fact]
    public async Task GetPostByIdAsync_WithValidIdAndActivePost_ReturnsPost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var post = new Post
        {
            Id = postId,
            UserId = userId,
            Content = "Test post",
            Status = Status.active,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(post);

        // Act
        var result = await _postService.GetPostByIdAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(postId, result.Id);
        Assert.Equal("Test post", result.Content);
        Assert.Equal("Public", result.Visibility);
        _mockPostRepository.Verify(x => x.GetByIdAsync(postId), Times.Once);
    }

    [Fact]
    public async Task GetPostByIdAsync_WithDeletedPost_ReturnsNull()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var deletedPost = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Deleted post",
            Status = Status.deleted,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            DeletedAt = DateTime.UtcNow
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(deletedPost);

        // Act
        var result = await _postService.GetPostByIdAsync(postId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetPostByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var postId = Guid.NewGuid();
        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync((Post?)null);

        // Act
        var result = await _postService.GetPostByIdAsync(postId);

        // Assert
        Assert.Null(result);
        _mockPostRepository.Verify(x => x.GetByIdAsync(postId), Times.Once);
    }

    [Fact]
    public async Task GetPostByIdAsync_WithHiddenPost_ReturnsPost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var hiddenPost = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Hidden post",
            Status = Status.hidden,
            Visibility = Visibility.Private,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(hiddenPost);

        // Act
        var result = await _postService.GetPostByIdAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("hidden", result.Status);
    }

    #endregion

    #region CreatePostAsync Tests

    [Fact]
    public async Task CreatePostAsync_WithValidRequest_CreatesAndReturnsPost()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createPostDto = new CreatePostDto
        {
            UserId = userId,
            Content = "New post content",
            Visibility = Visibility.Public
        };

        _mockPostRepository
            .Setup(x => x.AddAsync(It.IsAny<Post>()))
            .Returns(Task.CompletedTask);
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _postService.CreatePostAsync(createPostDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal("New post content", result.Content);
        Assert.Equal("Public", result.Visibility);
        Assert.Equal("active", result.Status);
        _mockPostRepository.Verify(x => x.AddAsync(It.IsAny<Post>()), Times.Once);
        _mockPostRepository.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreatePostAsync_WithEmptyContent_CreatesPost()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createPostDto = new CreatePostDto
        {
            UserId = userId,
            Content = string.Empty,
            Visibility = Visibility.Friends
        };

        _mockPostRepository
            .Setup(x => x.AddAsync(It.IsAny<Post>()))
            .Returns(Task.CompletedTask);
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _postService.CreatePostAsync(createPostDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal("Friends", result.Visibility);
        _mockPostRepository.Verify(x => x.AddAsync(It.IsAny<Post>()), Times.Once);
    }

    [Fact]
    public async Task CreatePostAsync_WithPrivateVisibility_CreatesPost()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createPostDto = new CreatePostDto
        {
            UserId = userId,
            Content = "Private post",
            Visibility = Visibility.Private
        };

        _mockPostRepository
            .Setup(x => x.AddAsync(It.IsAny<Post>()))
            .Returns(Task.CompletedTask);
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _postService.CreatePostAsync(createPostDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Private", result.Visibility);
    }

    [Fact]
    public async Task CreatePostAsync_SetsCorrectMetadata()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createPostDto = new CreatePostDto
        {
            UserId = userId,
            Content = "Test content",
            Visibility = Visibility.Public
        };

        Post? capturedPost = null;
        _mockPostRepository
            .Setup(x => x.AddAsync(It.IsAny<Post>()))
            .Callback<Post>(p => capturedPost = p)
            .Returns(Task.CompletedTask);
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        await _postService.CreatePostAsync(createPostDto);

        // Assert
        Assert.NotNull(capturedPost);
        Assert.NotEqual(Guid.Empty, capturedPost.Id);
        Assert.Equal(Status.active, capturedPost.Status);
        Assert.NotEqual(default, capturedPost.CreatedAt);
        Assert.NotEqual(default, capturedPost.UpdatedAt);
    }

    #endregion

    #region UpdatePostAsync Tests

    [Fact]
    public async Task UpdatePostAsync_WithValidIdAndRequest_UpdatesAndReturnsPost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var originalPost = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Original content",
            Status = Status.active,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var updatePostDto = new UpdatePostDto
        {
            Content = "Updated content",
            Visibility = Visibility.Friends
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(originalPost);
        _mockPostRepository
            .Setup(x => x.Update(It.IsAny<Post>()))
            .Callback<Post>(p =>
            {
                p.Content = "Updated content";
                p.Visibility = Visibility.Friends;
            });
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _postService.UpdatePostAsync(postId, updatePostDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(postId, result.Id);
        Assert.Equal("Updated content", result.Content);
        Assert.Equal("Friends", result.Visibility);
        _mockPostRepository.Verify(x => x.GetByIdAsync(postId), Times.Once);
        _mockPostRepository.Verify(x => x.Update(It.IsAny<Post>()), Times.Once);
        _mockPostRepository.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdatePostAsync_WithDeletedPost_ReturnsNull()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var deletedPost = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Deleted post",
            Status = Status.deleted,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            DeletedAt = DateTime.UtcNow
        };

        var updatePostDto = new UpdatePostDto
        {
            Content = "Updated content",
            Visibility = Visibility.Friends
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(deletedPost);

        // Act
        var result = await _postService.UpdatePostAsync(postId, updatePostDto);

        // Assert
        Assert.Null(result);
        _mockPostRepository.Verify(x => x.Update(It.IsAny<Post>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePostAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var updatePostDto = new UpdatePostDto
        {
            Content = "Updated content",
            Visibility = Visibility.Public
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync((Post?)null);

        // Act
        var result = await _postService.UpdatePostAsync(postId, updatePostDto);

        // Assert
        Assert.Null(result);
        _mockPostRepository.Verify(x => x.Update(It.IsAny<Post>()), Times.Never);
    }

    [Fact]
    public async Task UpdatePostAsync_UpdatesOnlyChangedFields()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var originalPost = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Original content",
            Status = Status.active,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var originalUserId = originalPost.UserId;
        var updatePostDto = new UpdatePostDto
        {
            Content = "Updated content",
            Visibility = Visibility.Friends
        };

        Post? capturedPost = null;
        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(originalPost);
        _mockPostRepository
            .Setup(x => x.Update(It.IsAny<Post>()))
            .Callback<Post>(p => capturedPost = p);
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        await _postService.UpdatePostAsync(postId, updatePostDto);

        // Assert
        Assert.NotNull(capturedPost);
        Assert.Equal(originalUserId, capturedPost.UserId); // UserId should not change
        Assert.Equal(Status.active, capturedPost.Status); // Status should not change
    }

    #endregion

    #region DeletePostAsync Tests

    [Fact]
    public async Task DeletePostAsync_WithValidId_SoftDeletesPost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var post = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Post to delete",
            Status = Status.active,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(post);
        _mockPostRepository
            .Setup(x => x.Update(It.IsAny<Post>()))
            .Callback<Post>(p =>
            {
                p.Status = Status.deleted;
                p.DeletedAt = DateTime.UtcNow;
            });
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _postService.DeletePostAsync(postId);

        // Assert
        Assert.True(result);
        _mockPostRepository.Verify(x => x.GetByIdAsync(postId), Times.Once);
        _mockPostRepository.Verify(x => x.Update(It.IsAny<Post>()), Times.Once);
        _mockPostRepository.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeletePostAsync_WithDeletedPost_ReturnsFalse()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var deletedPost = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Already deleted post",
            Status = Status.deleted,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            DeletedAt = DateTime.UtcNow
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(deletedPost);

        // Act
        var result = await _postService.DeletePostAsync(postId);

        // Assert
        Assert.False(result);
        _mockPostRepository.Verify(x => x.Update(It.IsAny<Post>()), Times.Never);
    }

    [Fact]
    public async Task DeletePostAsync_WithNonExistentId_ReturnsFalse()
    {
        // Arrange
        var postId = Guid.NewGuid();
        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync((Post?)null);

        // Act
        var result = await _postService.DeletePostAsync(postId);

        // Assert
        Assert.False(result);
        _mockPostRepository.Verify(x => x.Update(It.IsAny<Post>()), Times.Never);
    }

    [Fact]
    public async Task DeletePostAsync_SetsDeletedAtTimestamp()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var beforeDelete = DateTime.UtcNow;
        var post = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Post to delete",
            Status = Status.active,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Post? capturedPost = null;
        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(post);
        _mockPostRepository
            .Setup(x => x.Update(It.IsAny<Post>()))
            .Callback<Post>(p =>
            {
                p.Status = Status.deleted;
                p.DeletedAt = DateTime.UtcNow;
                capturedPost = p;
            });
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        await _postService.DeletePostAsync(postId);

        // Assert
        Assert.NotNull(capturedPost);
        Assert.NotNull(capturedPost.DeletedAt);
        Assert.True(capturedPost.DeletedAt >= beforeDelete);
    }

    [Fact]
    public async Task DeletePostAsync_WithHiddenPost_DeletesSuccessfully()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var hiddenPost = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Hidden post",
            Status = Status.hidden,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(hiddenPost);
        _mockPostRepository
            .Setup(x => x.Update(It.IsAny<Post>()))
            .Callback<Post>(p =>
            {
                p.Status = Status.deleted;
                p.DeletedAt = DateTime.UtcNow;
            });
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _postService.DeletePostAsync(postId);

        // Assert
        Assert.True(result);
    }

    #endregion

    #region Edge Cases and Error Scenarios

    [Fact]
    public async Task CreatePostAsync_WithRepositoryException_PropagatesException()
    {
        // Arrange
        var createPostDto = new CreatePostDto
        {
            UserId = Guid.NewGuid(),
            Content = "Test content",
            Visibility = Visibility.Public
        };

        _mockPostRepository
            .Setup(x => x.AddAsync(It.IsAny<Post>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => _postService.CreatePostAsync(createPostDto));
    }

    [Fact]
    public async Task UpdatePostAsync_WithMaxLengthContent_UpdatesSuccessfully()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var maxContent = new string('a', 2000);
        var post = new Post
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            Content = "Original",
            Status = Status.active,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var updatePostDto = new UpdatePostDto
        {
            Content = maxContent,
            Visibility = Visibility.Public
        };

        _mockPostRepository
            .Setup(x => x.GetByIdAsync(postId))
            .ReturnsAsync(post);
        _mockPostRepository
            .Setup(x => x.Update(It.IsAny<Post>()))
            .Callback<Post>(p => p.Content = maxContent);
        _mockPostRepository
            .Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _postService.UpdatePostAsync(postId, updatePostDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(maxContent.Length, result.Content!.Length);
    }

    [Fact]
    public async Task GetAllActivePostsAsync_VerifiesMapperCorrectness()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var post = new Post
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Content = "Test post",
            Status = Status.active,
            Visibility = Visibility.Public,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockPostRepository
            .Setup(x => x.GetAllAsync())
            .ReturnsAsync(new[] { post });

        // Act
        var result = await _postService.GetAllActivePostsAsync();
        var postDto = result.First();

        // Assert
        Assert.Equal(post.Id, postDto.Id);
        Assert.Equal(post.UserId, postDto.UserId);
        Assert.Equal(post.Content, postDto.Content);
        Assert.Equal(post.Visibility.ToString(), postDto.Visibility);
        Assert.Equal(post.Status.ToString(), postDto.Status);
        Assert.Equal(post.CreatedAt, postDto.CreatedAt);
        Assert.Equal(post.UpdatedAt, postDto.UpdatedAt);
    }

    #endregion
}
