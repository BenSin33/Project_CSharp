using InteractHub.Api.DTOs.Post;
namespace InteractHub.Api.Services.Interface;

public interface IPostService
{
    Task<IEnumerable<PostResponseDto>> GetAllActivePostsAsync();
    Task<PostResponseDto?> GetPostByIdAsync(Guid id);
    Task<PostResponseDto> CreatePostAsync(CreatePostDto request);
    Task<PostResponseDto?> UpdatePostAsync(Guid id, UpdatePostDto request);
    Task<bool> DeletePostAsync(Guid id);
}