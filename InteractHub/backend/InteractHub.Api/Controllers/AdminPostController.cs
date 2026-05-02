using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Controllers;

[Route("api/admin/posts")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminPostController : ControllerBase
{
    private readonly IAdminPostService _postService;

    public AdminPostController(IAdminPostService postService)
    {
        _postService = postService;
    }

    /// <summary>
    /// Get detailed admin view of a post (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPostDetail(Guid id)
    {
        var post = await _postService.GetPostDetailAsync(id);
        if (post == null)
            return NotFound(ApiResponse<AdminPostDetailDTO>.Fail("Post not found"));

        return Ok(ApiResponse<AdminPostDetailDTO>.Ok(post, "Post detail retrieved"));
    }

    /// <summary>
    /// Delete a post (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(Guid id, [FromBody] AdminDeletePostDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Validation failed", errors));
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var result = await _postService.DeletePostAsync(id, adminId, request);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Post not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Post deleted successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Hide a post (Admin only)
    /// </summary>
    [HttpPost("{id}/hide")]
    public async Task<IActionResult> HidePost(Guid id, [FromBody] string reason)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var result = await _postService.HidePostAsync(id, adminId, reason);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Post not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Post hidden successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Unhide a post (Admin only)
    /// </summary>
    [HttpPost("{id}/unhide")]
    public async Task<IActionResult> UnhidePost(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var result = await _postService.UnhidePostAsync(id, adminId);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Post not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Post unhidden successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Update post visibility (Admin only)
    /// </summary>
    [HttpPut("{id}/visibility")]
    public async Task<IActionResult> UpdatePostVisibility(Guid id, [FromBody] UpdatePostVisibilityDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Validation failed", errors));
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var result = await _postService.UpdatePostVisibilityAsync(id, adminId, request);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Post not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Post visibility updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Update post status (Admin only)
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdatePostStatus(Guid id, [FromBody] UpdatePostStatusDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Validation failed", errors));
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var result = await _postService.UpdatePostStatusAsync(id, adminId, request);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Post not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Post status updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get all reported posts (Admin only)
    /// </summary>
    [HttpGet("reported")]
    public async Task<IActionResult> GetReportedPosts([FromQuery] int skip = 0, [FromQuery] int take = 20)
    {
        if (skip < 0 || take <= 0)
        {
            return BadRequest(ApiResponse<PaginatedResponse<AdminPostDetailDTO>>.Fail("Skip must be >= 0 and Take must be > 0"));
        }

        var posts = await _postService.GetReportedPostsAsync(skip, take);
        return Ok(ApiResponse<PaginatedResponse<AdminPostDetailDTO>>.Ok(posts, "Reported posts retrieved"));
    }

    /// <summary>
    /// Get posts by a specific user (Admin only)
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetPostsByUser(Guid userId, [FromQuery] int skip = 0, [FromQuery] int take = 20)
    {
        if (skip < 0 || take <= 0)
        {
            return BadRequest(ApiResponse<PaginatedResponse<AdminPostDetailDTO>>.Fail("Skip must be >= 0 and Take must be > 0"));
        }

        var posts = await _postService.GetPostsByUserAsync(userId, skip, take);
        return Ok(ApiResponse<PaginatedResponse<AdminPostDetailDTO>>.Ok(posts, $"Posts by user retrieved"));
    }

    /// <summary>
    /// Perform bulk action on multiple posts (Admin only)
    /// </summary>
    [HttpPost("bulk-action")]
    public async Task<IActionResult> BulkPostAction([FromBody] BulkPostActionDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Validation failed", errors));
        }

        if (request.PostIds.Count == 0)
        {
            return BadRequest(ApiResponse<string>.Fail("PostIds list cannot be empty"));
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var (success, failed) = await _postService.BulkPostActionAsync(adminId, request);
            
            var result = new
            {
                success,
                failed,
                total = success + failed
            };

            return Ok(ApiResponse<object>.Ok(result, $"Bulk action completed: {success} succeeded, {failed} failed"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Search posts (Admin only)
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> SearchPosts([FromQuery] string query, [FromQuery] int skip = 0, [FromQuery] int take = 20)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(ApiResponse<PaginatedResponse<AdminPostDetailDTO>>.Fail("Search query cannot be empty"));
        }

        if (skip < 0 || take <= 0)
        {
            return BadRequest(ApiResponse<PaginatedResponse<AdminPostDetailDTO>>.Fail("Skip must be >= 0 and Take must be > 0"));
        }

        try
        {
            var posts = await _postService.SearchPostsAsync(query, skip, take);
            return Ok(ApiResponse<PaginatedResponse<AdminPostDetailDTO>>.Ok(posts, "Posts search completed"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get posts pending review (Admin only)
    /// </summary>
    [HttpGet("pending-review")]
    public async Task<IActionResult> GetPostsPendingReview()
    {
        try
        {
            var posts = await _postService.GetPostsPendingReviewAsync();
            return Ok(ApiResponse<List<AdminPostDetailDTO>>.Ok(posts, $"Found {posts.Count} posts pending review"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Delete a comment (Admin only)
    /// </summary>
    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid commentId, [FromBody] string reason)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var result = await _postService.DeleteCommentAsync(commentId, adminId, reason);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Comment not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Comment deleted successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }
}
