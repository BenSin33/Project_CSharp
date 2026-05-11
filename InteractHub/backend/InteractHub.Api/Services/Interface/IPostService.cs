using InteractHub.Api.DTOs.Post;
using InteractHub.Api.DTOs.Common;

namespace InteractHub.Api.Services.Interface;

public interface IPostService
{
    Task<IEnumerable<PostResponseDto>> GetAllActivePostsAsync();
    Task<PaginatedResponse<PostResponseDto>> GetAllActivePostsAsync(int skip, int take, Guid? currentUserId = null);
    Task<PostResponseDto?> GetPostByIdAsync(Guid id, Guid? currentUserId = null);
    Task<PostResponseDto> CreatePostAsync(CreatePostDto request);
    Task<PostResponseDto?> UpdatePostAsync(Guid id, UpdatePostDto request);
    Task<bool> DeletePostAsync(Guid id);
    Task<PaginatedResponse<PostResponseDto>> SearchPostsAsync(string query, int skip, int take, Guid? currentUserId = null);
    Task<PaginatedResponse<PostResponseDto>> GetPostsByUserAsync(Guid userId, int skip, int take, Guid? currentUserId = null);
    Task<PaginatedResponse<PostResponseDto>> GetTrendingPostsAsync(int skip, int take, Guid? currentUserId = null);
    Task<PaginatedResponse<PostResponseDto>> GetReelPostsAsync(int skip, int take, Guid? currentUserId = null);
   
}