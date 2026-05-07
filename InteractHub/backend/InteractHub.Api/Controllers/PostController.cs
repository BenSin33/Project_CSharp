using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InteractHub.Api.DTOs.Post;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Models;
using System.Runtime.ExceptionServices;
using System.Security.Claims;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PostController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ISavedPostService _savedPostService;

    public PostController(IPostService postService, ISavedPostService savedPostService)
    {
        _postService = postService;
        _savedPostService = savedPostService;
    }

    /// <summary>
    /// Get helper method to extract current user ID from claims
    /// </summary>
    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }
        return userId;
    }

    [HttpGet("trending")]
    public async Task<IActionResult> GetTrendingPosts([FromQuery] int skip = 0, [FromQuery] int take = 6)
    {
        if (skip < 0 || take <= 0)
            return BadRequest(ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Skip must be >= 0 and Take must be > 0"));

        try
        {
            var currentUserId = GetCurrentUserId();
            var posts = await _postService.GetTrendingPostsAsync(skip, take, currentUserId);
            return Ok(ApiResponse<PaginatedResponse<PostResponseDto>>.Ok(posts, "Trending posts retrieved successfully."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Server error: " + ex.Message));
        }
    }

    [HttpGet]
public async Task<IActionResult> GetAllPosts([FromQuery] int skip = 0, [FromQuery] int take = 20)
{
    if (skip < 0 || take <= 0)
        return BadRequest(ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Skip must be >= 0 and Take must be > 0"));

    try
    {
        var currentUserId = GetCurrentUserId();
        var posts = await _postService.GetAllActivePostsAsync(skip, take, currentUserId);
        return Ok(ApiResponse<PaginatedResponse<PostResponseDto>>.Ok(posts, "Posts retrieved successfully."));
    }
    catch (Exception ex)
    {
        // Log để tìm lỗi thực sự
        Console.WriteLine($"[GetAllPosts ERROR] {ex}");
        return StatusCode(500, ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Lỗi server: " + ex.Message));
    }
}

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetPostsByUser(Guid userId, [FromQuery] int skip = 0, [FromQuery] int take = 20)
    {
        if (skip < 0 || take <= 0)
            return BadRequest(ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Skip must be >= 0 and Take must be > 0"));
        try
        {
            var currentUserId = GetCurrentUserId();
            var posts = await _postService.GetPostsByUserAsync(userId, skip, take, currentUserId);
            return Ok(ApiResponse<PaginatedResponse<PostResponseDto>>.Ok(posts, "Posts retrieved successfully."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Server error: " + ex.Message));
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchPosts([FromQuery] string q, [FromQuery] int skip = 0, [FromQuery] int take = 20)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Search query cannot be empty"));
        }

        if (skip < 0 || take <= 0)
        {
            return BadRequest(ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Skip must be >= 0 and Take must be > 0"));
        }

        var currentUserId = GetCurrentUserId();
        var results = await _postService.SearchPostsAsync(q, skip, take, currentUserId);
        return Ok(ApiResponse<PaginatedResponse<PostResponseDto>>.Ok(results, "Search completed successfully."));
    }

    [HttpGet("saved")]
    [Authorize]
    public async Task<IActionResult> GetSavedPosts([FromQuery] int skip = 0, [FromQuery] int take = 20)
    {
        if (skip < 0 || take <= 0)
        {
            return BadRequest(ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("Skip must be >= 0 and Take must be > 0"));
        }

        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized(ApiResponse<PaginatedResponse<PostResponseDto>>.Fail("User not authenticated"));
        }

        var savedPosts = await _savedPostService.GetUserSavedPostsAsync(currentUserId.Value, skip, take, currentUserId);
        return Ok(ApiResponse<PaginatedResponse<PostResponseDto>>.Ok(savedPosts, "Saved posts retrieved successfully."));
    }

    [HttpPost("{id}/save")]
    [Authorize]
    public async Task<IActionResult> SavePost(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized(ApiResponse<SavedPostResponseDto>.Fail("User not authenticated"));
        }

        var savedPost = await _savedPostService.SavePostAsync(currentUserId.Value, id);
        if (savedPost == null)
        {
            return NotFound(ApiResponse<SavedPostResponseDto>.Fail($"Post with ID {id} not found"));
        }

        return Ok(ApiResponse<SavedPostResponseDto>.Ok(savedPost, "Post saved successfully."));
    }

    [HttpDelete("{id}/unsave")]
    [Authorize]
    public async Task<IActionResult> UnsavePost(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized(ApiResponse<bool>.Fail("User not authenticated"));
        }

        var result = await _savedPostService.UnsavePostAsync(currentUserId.Value, id);
        if (!result)
        {
            return NotFound(ApiResponse<bool>.Fail($"Saved post not found"));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Post removed from saved successfully."));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPostById(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var post = await _postService.GetPostByIdAsync(id, currentUserId);
        if (post == null)
        {
            return NotFound(ApiResponse<PostResponseDto>.Fail($"Post with ID {id} not found"));
        }
        return Ok(ApiResponse<PostResponseDto>.Ok(post, "Post retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
                
            // Sử dụng hàm Fail() của ApiResponse 
            return BadRequest(ApiResponse<PostResponseDto>.Fail("Validation failed", errors));
        }

        try
        {
            // 1. Service xử lý lưu Post và PostMedia vào Database
            var createdPost = await _postService.CreatePostAsync(request);

            // 2. Sử dụng hàm Ok() của ApiResponse
            return CreatedAtAction(
                nameof(GetPostById), 
                new { id = createdPost.Id },
                ApiResponse<PostResponseDto>.Ok(createdPost, "Bài viết đã được đăng thành công!")
            );
        }
        catch (Exception ex)
        {
            // Xử lý lỗi hệ thống (ví dụ: mất kết nối DB)
            return StatusCode(500, ApiResponse<PostResponseDto>.Fail("Lỗi server: " + ex.Message));
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePost(Guid id, [FromBody] UpdatePostDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<PostResponseDto>.Fail("Validation failed", errors));
        }

        var updatePost = await _postService.UpdatePostAsync(id,request);
        if(updatePost == null)
        {
            return NotFound(ApiResponse<PostResponseDto>.Fail($"Post with ID {id} not found or deleted."));
        }

        return Ok(ApiResponse<PostResponseDto>.Ok(updatePost, "Post updated successfully."));

    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var  isDeleted = await _postService.DeletePostAsync(id);
        if (!isDeleted)
        {
            return NotFound(ApiResponse<bool>.Fail($"Post with ID {id} not found."));
        }
        return Ok(ApiResponse<bool>.Ok(true, "Post deleted successfully."));
    }

    [HttpPost("report")]
    [Authorize]
    public async Task<IActionResult> ReportPost([FromBody] ReportPostRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
            return Unauthorized(ApiResponse<bool>.Fail("User not authenticated"));

        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(ApiResponse<bool>.Fail("Reason is required"));

        try
        {
            var report = new PostReport
            {
                UserId      = currentUserId.Value,
                PostId      = request.PostId,
                Reason      = request.Reason,
                ReportType  = (ReportType)(request.ReportType ?? 3),
                ReportStatus = ReportStatus.Pending,
            };

            var dbContext = HttpContext.RequestServices
                .GetRequiredService<InteractHub.Api.Data.ApplicationDbContext>();
            dbContext.PostReports.Add(report);
            await dbContext.SaveChangesAsync();

            return Ok(ApiResponse<bool>.Ok(true, "Post reported successfully."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<bool>.Fail("Server error: " + ex.Message));
        }
    }

}

public class ReportPostRequest
{
    public Guid PostId { get; set; }
    public string Reason { get; set; } = "";
    public int? ReportType { get; set; }
}