using Moq;
using Xunit;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs.Story;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Repositories;

using Microsoft.AspNetCore.SignalR;
using InteractHub.Api.Hubs;

namespace InteractHub.Tests;

public class StoryServiceTests : TestBase
{
    private readonly Mock<IGenericRepository<Story>> _storyRepositoryMock;
    private readonly Mock<IHubContext<NotificationHub>> _hubContextMock;
    private readonly StoryService _storyService;

    public StoryServiceTests()
    {
        _storyRepositoryMock = new Mock<IGenericRepository<Story>>();
        _hubContextMock = CreateHubContextMock();
        _storyService = new StoryService(_storyRepositoryMock.Object, _hubContextMock.Object);
    }

    [Fact]
    public async Task GetActiveStoriesAsync_WithMixedStories_ReturnsOnlyActive()
    {
        var now = DateTime.UtcNow;
        var stories = new List<Story>
        {
            new Story { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), StoryContent = "Active", MediaUrl = "http://example.com/1.jpg", ExpireAt = now.AddHours(12), DeletedAt = null, CreatedAt = now },
            new Story { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), StoryContent = "Expired", MediaUrl = "http://example.com/2.jpg", ExpireAt = now.AddHours(-1), DeletedAt = null, CreatedAt = now.AddHours(-25) },
            new Story { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), StoryContent = "Deleted", MediaUrl = "http://example.com/3.jpg", ExpireAt = now.AddHours(12), DeletedAt = now, CreatedAt = now }
        };

        _storyRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(stories);
        var result = await _storyService.GetActiveStoriesAsync();
        
        Assert.Single(result);
        Assert.Equal("Active", result.First().StoryContent);
    }

    [Fact]
    public async Task GetUserActiveStoriesAsync_ValidUserId_ReturnsOnlyUserActiveStories()
    {
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var stories = new List<Story>
        {
            new Story { Id = Guid.NewGuid(), UserId = userId, StoryContent = "User Active", MediaUrl = "http://example.com/1.jpg", ExpireAt = now.AddHours(12), DeletedAt = null, CreatedAt = now },
            new Story { Id = Guid.NewGuid(), UserId = userId, StoryContent = "User Expired", MediaUrl = "http://example.com/2.jpg", ExpireAt = now.AddHours(-1), DeletedAt = null, CreatedAt = now.AddHours(-25) },
            new Story { Id = Guid.NewGuid(), UserId = otherUserId, StoryContent = "Other Active", MediaUrl = "http://example.com/3.jpg", ExpireAt = now.AddHours(12), DeletedAt = null, CreatedAt = now }
        };

        _storyRepositoryMock.Setup(x => x.GetAllAsync()).ReturnsAsync(stories);
        var result = await _storyService.GetUserActiveStoriesAsync(userId);
        
        Assert.Single(result);
        Assert.Equal(userId, result.First().UserId);
    }

    [Fact]
    public async Task CreateStoryAsync_ValidData_CreatesStoryWith24HourExpiry()
    {
        var userId = Guid.NewGuid();
        var beforeCreation = DateTime.UtcNow;
        var dto = new CreateStoryDTO { StoryContent = "Test Story", MediaUrl = "http://example.com/image.jpg" };

        Story? capturedStory = null;
        _storyRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Story>()))
            .Callback<Story>(s => capturedStory = s)
            .Returns(Task.CompletedTask);

        _storyRepositoryMock.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        var afterCreation = DateTime.UtcNow;
        await _storyService.CreateStoryAsync(userId, dto);

        Assert.NotNull(capturedStory);
        Assert.Equal(userId, capturedStory.UserId);
        Assert.Equal("Test Story", capturedStory.StoryContent);
        Assert.Null(capturedStory.DeletedAt);
        
        var expectedExpiry = afterCreation.AddHours(24);
        Assert.True(Math.Abs((capturedStory.ExpireAt - expectedExpiry).TotalMinutes) < 1);
    }

    [Fact]
    public async Task DeleteStoryAsync_OwnerRequesting_SoftDeletes()
    {
        var userId = Guid.NewGuid();
        var storyId = Guid.NewGuid();
        var story = new Story { Id = storyId, UserId = userId, StoryContent = "Test", MediaUrl = "http://example.com/image.jpg", ExpireAt = DateTime.UtcNow.AddHours(12), DeletedAt = null, CreatedAt = DateTime.UtcNow };

        _storyRepositoryMock.Setup(x => x.GetByIdAsync(storyId)).ReturnsAsync(story);
        _storyRepositoryMock.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await _storyService.DeleteStoryAsync(storyId, userId);

        Assert.True(result);
        Assert.NotNull(story.DeletedAt);
    }

    [Fact]
    public async Task DeleteStoryAsync_NonOwnerRequesting_ReturnsFalse()
    {
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var storyId = Guid.NewGuid();
        var story = new Story { Id = storyId, UserId = ownerId, StoryContent = "Test", MediaUrl = "http://example.com/image.jpg", DeletedAt = null };

        _storyRepositoryMock.Setup(x => x.GetByIdAsync(storyId)).ReturnsAsync(story);
        var result = await _storyService.DeleteStoryAsync(storyId, requesterId);
        
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteStoryAsync_StoryNotFound_ReturnsFalse()
    {
        var userId = Guid.NewGuid();
        var storyId = Guid.NewGuid();

        _storyRepositoryMock.Setup(x => x.GetByIdAsync(storyId)).ReturnsAsync((Story?)null);
        var result = await _storyService.DeleteStoryAsync(storyId, userId);
        
        Assert.False(result);
    }
}
