using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using InteractHub.Api.Controllers;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs;
using InteractHub.Api.Services;

namespace InteractHub.Tests;

public class PostControllerTests
{
    private readonly Mock<IPostsService> _postsServiceMock;
    private readonly PostsController _postsController;
    private readonly Guid _testUserId = Guid.NewGuid();

    public PostControllerTests()
    {
        _postsServiceMock = new Mock<IPostsService>();
        _postsController = new PostsController(_postsServiceMock.Object);

        // Setup User Claims for Authorization
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);
        _postsController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetNewsFeed Tests
    [Fact]
    public async Task GetNewsFeed_ReturnsOk_WithPostList()
    {
        // Arrange
        var posts = new List<PostResponseDTO>
        {
            new PostResponseDTO
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                AuthorName = "Test User 1",
                AuthorAvatar = "https://example.com/avatar1.jpg",
                Content = "Test post 1",
                Visibility = "Public",
                CreatedAt = DateTime.UtcNow,
                MediaItems = new List<MediaItemDTO> { new MediaItemDTO { Url = "https://example.com/image1.jpg", Type = MediaType.image } },
                LikeCount = 5,
                CommentCount = 2,
                ShareCount = 1
            },
            new PostResponseDTO
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                AuthorName = "Test User 2",
                AuthorAvatar = "https://example.com/avatar2.jpg",
                Content = "Test post 2",
                Visibility = "Friends",
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                MediaItems = new List<MediaItemDTO>(),
                LikeCount = 10,
                CommentCount = 5,
                ShareCount = 3
            }
        };

        _postsServiceMock.Setup(x => x.GetNewsFeedAsync())
            .ReturnsAsync(posts);

        // Act
        var result = await _postsController.GetNewsFeed();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedPosts = Assert.IsType<List<PostResponseDTO>>(okResult.Value);
        Assert.Equal(2, returnedPosts.Count);
        Assert.Equal("Test post 1", returnedPosts[0].Content);
        Assert.Equal(5, returnedPosts[0].LikeCount);
    }

    [Fact]
    public async Task GetNewsFeed_ReturnsEmpty_WhenNoPosts()
    {
        // Arrange
        var emptyPosts = new List<PostResponseDTO>();
        _postsServiceMock.Setup(x => x.GetNewsFeedAsync())
            .ReturnsAsync(emptyPosts);

        // Act
        var result = await _postsController.GetNewsFeed();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedPosts = Assert.IsType<List<PostResponseDTO>>(okResult.Value);
        Assert.Empty(returnedPosts);
    }
    #endregion

    #region GetPost Tests
    [Fact]
    public async Task GetPost_WithValidId_ReturnsOkWithPost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var post = new PostResponseDTO
        {
            Id = postId,
            UserId = Guid.NewGuid(),
            AuthorName = "Test User",
            AuthorAvatar = "https://example.com/avatar.jpg",
            Content = "This is a test post",
            Visibility = "Public",
            CreatedAt = DateTime.UtcNow,
            MediaItems = new List<MediaItemDTO>
            {
                new MediaItemDTO { Url = "https://example.com/image1.jpg", Type = MediaType.image },
                new MediaItemDTO { Url = "https://example.com/image2.jpg", Type = MediaType.image }
            },
            LikeCount = 8,
            CommentCount = 3,
            ShareCount = 2
        };

        _postsServiceMock.Setup(x => x.GetPostByIdAsync(postId))
            .ReturnsAsync(post);

        // Act
        var result = await _postsController.GetPost(postId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedPost = Assert.IsType<PostResponseDTO>(okResult.Value);
        Assert.Equal(postId, returnedPost.Id);
        Assert.Equal("This is a test post", returnedPost.Content);
        Assert.Equal(2, returnedPost.MediaItems.Count);
    }

    [Fact]
    public async Task GetPost_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var postId = Guid.NewGuid();
        _postsServiceMock.Setup(x => x.GetPostByIdAsync(postId))
            .ReturnsAsync((PostResponseDTO?)null);

        // Act
        var result = await _postsController.GetPost(postId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var responseMessage = Assert.IsType<dynamic>(notFoundResult.Value);
        Assert.NotNull(responseMessage);
    }
    #endregion

    #region CreatePost Tests
    [Fact]
    public async Task CreatePost_WithValidData_ReturnsCreatedAtAction()
    {
        // Arrange
        var createDto = new PostCreateDTO(
            "New post content",
            Visibility.Public,
            new List<MediaItemDTO> { new MediaItemDTO { Url = "https://example.com/image.jpg", Type = MediaType.image } }
        );

        var createdPost = new PostResponseDTO
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            AuthorName = "Test User",
            AuthorAvatar = "https://example.com/avatar.jpg",
            Content = createDto.Content,
            Visibility = "Public",
            CreatedAt = DateTime.UtcNow,
            MediaItems = createDto.MediaItems ?? new List<MediaItemDTO>(),
            LikeCount = 0,
            CommentCount = 0,
            ShareCount = 0
        };

        _postsServiceMock.Setup(x => x.CreatePostAsync(_testUserId, createDto))
            .ReturnsAsync(createdPost);

        // Act
        var result = await _postsController.CreatePost(createDto);

        // Assert
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(PostsController.GetPost), createdAtActionResult.ActionName);
        Assert.Equal(createdPost.Id, ((PostResponseDTO)createdAtActionResult.Value!).Id);
    }

    [Fact]
    public async Task CreatePost_WithoutUser_ReturnsUnauthorized()
    {
        // Arrange - Create controller with empty user context
        var controller = new PostsController(_postsServiceMock.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };

        var createDto = new PostCreateDTO("Test content", Visibility.Public, null);

        // Act
        var result = await controller.CreatePost(createDto);

        // Assert
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task CreatePost_WithEmptyContent_ShouldValidate()
    {
        // Arrange
        var createDto = new PostCreateDTO(
            "", // Empty content
            Visibility.Public,
            null
        );

        // This test verifies that DTO validation rules are applied
        // In real scenario, validation would happen at model binding level
        var validationContext = new System.ComponentModel.DataAnnotations.ValidationContext(createDto);
        var validationResults = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
        var isValid = System.ComponentModel.DataAnnotations.Validator.TryValidateObject(createDto, validationContext, validationResults, true);

        // Assert
        Assert.False(isValid);
        Assert.NotEmpty(validationResults);
    }

    [Fact]
    public async Task CreatePost_WithMediaItems_IncludesMediaInResponse()
    {
        // Arrange
        var mediaItems = new List<MediaItemDTO>
        {
            new MediaItemDTO { Url = "https://example.com/image1.jpg", Type = MediaType.image },
            new MediaItemDTO { Url = "https://example.com/video.mp4", Type = MediaType.video }
        };

        var createDto = new PostCreateDTO("Post with media", Visibility.Friends, mediaItems);

        var createdPost = new PostResponseDTO
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            AuthorName = "Test User",
            Content = createDto.Content,
            Visibility = "Friends",
            CreatedAt = DateTime.UtcNow,
            MediaItems = mediaItems,
            LikeCount = 0,
            CommentCount = 0,
            ShareCount = 0
        };

        _postsServiceMock.Setup(x => x.CreatePostAsync(_testUserId, createDto))
            .ReturnsAsync(createdPost);

        // Act
        var result = await _postsController.CreatePost(createDto);

        // Assert
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result);
        var returnedPost = Assert.IsType<PostResponseDTO>(createdAtActionResult.Value);
        Assert.Equal(2, returnedPost.MediaItems.Count);
        Assert.Contains(returnedPost.MediaItems, m => m.Type == MediaType.image);
        Assert.Contains(returnedPost.MediaItems, m => m.Type == MediaType.video);
    }
    #endregion

    #region UpdatePost Tests
    [Fact]
    public async Task UpdatePost_WithValidData_ReturnsNoContent()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var updateDto = new PostUpdateDTO("Updated content", Visibility.Friends);

        _postsServiceMock.Setup(x => x.UpdatePostAsync(postId, _testUserId, updateDto))
            .ReturnsAsync(true);

        // Act
        var result = await _postsController.UpdatePost(postId, updateDto);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _postsServiceMock.Verify(x => x.UpdatePostAsync(postId, _testUserId, updateDto), Times.Once);
    }

    [Fact]
    public async Task UpdatePost_WithUnauthorizedUser_ReturnsBadRequest()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var updateDto = new PostUpdateDTO("Updated content", Visibility.Public);

        _postsServiceMock.Setup(x => x.UpdatePostAsync(postId, _testUserId, updateDto))
            .ReturnsAsync(false);

        // Act
        var result = await _postsController.UpdatePost(postId, updateDto);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var responseMessage = Assert.IsType<dynamic>(badRequestResult.Value);
        Assert.NotNull(responseMessage);
    }

    [Fact]
    public async Task UpdatePost_WithNonExistentPost_ReturnsBadRequest()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var updateDto = new PostUpdateDTO("Updated content", Visibility.Public);

        _postsServiceMock.Setup(x => x.UpdatePostAsync(postId, _testUserId, updateDto))
            .ReturnsAsync(false);

        // Act
        var result = await _postsController.UpdatePost(postId, updateDto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
    #endregion

    #region DeletePost Tests
    [Fact]
    public async Task DeletePost_WithValidData_ReturnsNoContent()
    {
        // Arrange
        var postId = Guid.NewGuid();

        _postsServiceMock.Setup(x => x.DeletePostAsync(postId, _testUserId))
            .ReturnsAsync(true);

        // Act
        var result = await _postsController.DeletePost(postId);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _postsServiceMock.Verify(x => x.DeletePostAsync(postId, _testUserId), Times.Once);
    }

    [Fact]
    public async Task DeletePost_WithUnauthorizedUser_ReturnsBadRequest()
    {
        // Arrange
        var postId = Guid.NewGuid();

        _postsServiceMock.Setup(x => x.DeletePostAsync(postId, _testUserId))
            .ReturnsAsync(false);

        // Act
        var result = await _postsController.DeletePost(postId);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var responseMessage = Assert.IsType<dynamic>(badRequestResult.Value);
        Assert.NotNull(responseMessage);
    }

    [Fact]
    public async Task DeletePost_WithNonExistentPost_ReturnsBadRequest()
    {
        // Arrange
        var postId = Guid.NewGuid();

        _postsServiceMock.Setup(x => x.DeletePostAsync(postId, _testUserId))
            .ReturnsAsync(false);

        // Act
        var result = await _postsController.DeletePost(postId);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
    #endregion
}
