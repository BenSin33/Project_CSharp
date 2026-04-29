using Microsoft.AspNetCore.Mvc;
using InteractHub.Api.DTOs.Post;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Models;
using System.Runtime.ExceptionServices;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PostController : ControllerBase
{
    private readonly IPostService _postService;

    public PostController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPosts()
    {
        var posts = await _postService.GetAllActivePostsAsync();
        return Ok(ApiResponse<IEnumerable<PostResponseDto>>.Ok(posts, "Posts retrieved successfully."));   
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPostById(Guid id)
    {
        var post = await _postService.GetPostByIdAsync(id);
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

}