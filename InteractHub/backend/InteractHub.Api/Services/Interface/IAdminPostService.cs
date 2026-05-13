using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services.Interface;

public interface IAdminPostService
{
    /// <summary>
    /// Get detailed admin view of a post
    /// </summary>
    Task<AdminPostDetailDTO?> GetPostDetailAsync(Guid postId);

    /// <summary>
    /// Delete a post (Admin only)
    /// </summary>
    Task<bool> DeletePostAsync(Guid postId, Guid adminId, AdminDeletePostDTO request);

    /// <summary>
    /// Hide a post (Admin only) - sets status to Hidden
    /// </summary>
    Task<bool> HidePostAsync(Guid postId, Guid adminId, string reason);

    /// <summary>
    /// Unhide a post
    /// </summary>
    Task<bool> UnhidePostAsync(Guid postId, Guid adminId);

    /// <summary>
    /// Update post visibility
    /// </summary>
    Task<bool> UpdatePostVisibilityAsync(Guid postId, Guid adminId, UpdatePostVisibilityDTO request);

    /// <summary>
    /// Update post status
    /// </summary>
    Task<bool> UpdatePostStatusAsync(Guid postId, Guid adminId, UpdatePostStatusDTO request);

    /// <summary>
    /// Get all reported posts (that have reports)
    /// </summary>
    Task<PaginatedResponse<AdminPostDetailDTO>> GetReportedPostsAsync(int skip = 0, int take = 20);

    /// <summary>
    /// Get posts by a specific user (for moderation)
    /// </summary>
    Task<PaginatedResponse<AdminPostDetailDTO>> GetPostsByUserAsync(Guid userId, int skip = 0, int take = 20);

    /// <summary>
    /// Perform bulk action on multiple posts
    /// </summary>
    Task<(int success, int failed)> BulkPostActionAsync(Guid adminId, BulkPostActionDTO request);

    /// <summary>
    /// Get flagged content
    /// </summary>
    Task<List<FlaggedContentDTO>> GetFlaggedContentAsync(int count = 50);

    /// <summary>
    /// Delete comments on a post (Admin only)
    /// </summary>
    Task<bool> DeleteCommentAsync(Guid commentId, Guid adminId, string reason);

    /// <summary>
    /// Search posts by criteria
    /// </summary>
    Task<PaginatedResponse<AdminPostDetailDTO>> SearchPostsAsync(string query, int skip = 0, int take = 20);

    /// <summary>
    /// Get posts pending review
    /// </summary>
    Task<List<AdminPostDetailDTO>> GetPostsPendingReviewAsync();

    /// <summary>
    /// Get all posts for admin moderation
    /// </summary>
    Task<PaginatedResponse<AdminPostDetailDTO>> GetAllPostsAsync(int skip = 0, int take = 20);
}
