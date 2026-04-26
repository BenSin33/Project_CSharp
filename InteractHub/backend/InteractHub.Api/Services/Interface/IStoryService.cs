using InteractHub.Api.DTOs.Story;

namespace InteractHub.Api.Services.Interface;

public interface IStoryService
{
    Task<IEnumerable<StoryResponseDTO>> GetActiveStoriesAsync();
    Task<IEnumerable<StoryResponseDTO>> GetUserActiveStoriesAsync(Guid userId);
    Task<StoryResponseDTO> CreateStoryAsync(Guid userId, CreateStoryDTO request);
    Task<bool> DeleteStoryAsync(Guid storyId, Guid userId);
}
