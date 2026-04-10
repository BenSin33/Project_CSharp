using InteractHub.Api.DTOs;

namespace InteractHub.Api.Services;

public interface IPostsService
{
    Task<IEnumerable<PostResponseDTO>> GetNewsFeedAsync(); 
    Task<PostResponseDTO?> GetPostByIdAsync(Guid id);
    Task<PostResponseDTO> CreatePostAsync(Guid userId, PostCreateDTO dto);
    Task<bool> UpdatePostAsync(Guid postId, Guid userId, PostUpdateDTO dto);
    Task<bool> DeletePostAsync(Guid postId, Guid userId);
}