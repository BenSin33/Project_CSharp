using InteractHub.Api.DTOs.Post;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.DTOs.Post_Interactions;

namespace InteractHub.Api.Services.Interface;

public interface ISavedPostService
{
    /// <summary>
    /// Save a post for the current user
    /// </summary>
    Task<SavedPostResponseDto?> SavePostAsync(Guid userId, Guid postId);

    /// <summary>
    /// Unsave (remove bookmark) a post for the current user
    /// </summary>
    Task<bool> UnsavePostAsync(Guid userId, Guid postId);

    /// <summary>
    /// Get all saved posts for a user with pagination
    /// </summary>
    Task<PaginatedResponse<PostResponseDto>> GetUserSavedPostsAsync(Guid userId, int skip, int take, Guid? currentUserId = null);

    /// <summary>
    /// Check if a post is saved by the current user
    /// </summary>
    Task<bool> IsPostSavedAsync(Guid userId, Guid postId);
}
