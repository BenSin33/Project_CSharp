using InteractHub.Api.DTOs.Story;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class StoryService : IStoryService
{
    private readonly IGenericRepository<Story> _storyRepo;

    public StoryService(IGenericRepository<Story> storyRepo)
    {
        _storyRepo = storyRepo;
    }

    public async Task<IEnumerable<StoryResponseDTO>> GetActiveStoriesAsync()
    {
        var now = DateTime.UtcNow;
        var stories = await _storyRepo.GetAllAsync();

        return stories
            .Where(s => s.DeletedAt == null && s.ExpireAt > now)
            .OrderByDescending(s => s.CreatedAt)
            .Select(MapToDTO);
    }

    public async Task<IEnumerable<StoryResponseDTO>> GetUserActiveStoriesAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var stories = await _storyRepo.GetAllAsync();

        return stories
            .Where(s => s.UserId == userId && s.DeletedAt == null && s.ExpireAt > now)
            .OrderByDescending(s => s.CreatedAt)
            .Select(MapToDTO);
    }

    public async Task<StoryResponseDTO> CreateStoryAsync(Guid userId, CreateStoryDTO request)
    {
        var story = new Story
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StoryContent = request.StoryContent,
            MediaUrl = request.MediaUrl,
            ExpireAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _storyRepo.AddAsync(story);
        await _storyRepo.SaveChangesAsync();

        return MapToDTO(story);
    }

    public async Task<bool> DeleteStoryAsync(Guid storyId, Guid userId)
    {
        var story = await _storyRepo.GetByIdAsync(storyId);
        if (story == null || story.DeletedAt != null || story.UserId != userId)
        {
            return false;
        }

        story.DeletedAt = DateTime.UtcNow;
        story.UpdatedAt = DateTime.UtcNow;
        _storyRepo.Update(story);
        await _storyRepo.SaveChangesAsync();

        return true;
    }

    private static StoryResponseDTO MapToDTO(Story story)
    {
        return new StoryResponseDTO
        {
            Id = story.Id,
            UserId = story.UserId,
            StoryContent = story.StoryContent,
            MediaUrl = story.MediaUrl,
            ExpireAt = story.ExpireAt,
            CreatedAt = story.CreatedAt
        };
    }
}
