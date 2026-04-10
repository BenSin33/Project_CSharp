using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InteractHub.Api.DTOs;
using InteractHub.Api.Services;

namespace InteractHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostsService _postsService;

    public PostsController(IPostsService postsService)
    {
        _postsService = postsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNewsFeed()
    {
        var posts = await _postsService.GetNewsFeedAsync();
        return Ok(posts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(Guid id)
    {
        var post = await _postsService.GetPostByIdAsync(id);
        if (post == null) return NotFound(new { message = "Không tìm thấy bài viết" });
        return Ok(post);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePost(PostCreateDTO dto)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var createdPost = await _postsService.CreatePostAsync(userId, dto);
        return CreatedAtAction(nameof(GetPost), new { id = createdPost.Id }, createdPost); 
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePost(Guid id, PostUpdateDTO dto)
    {
        var userId = GetCurrentUserId();
        var success = await _postsService.UpdatePostAsync(id, userId, dto);
        
        if (!success) return BadRequest(new { message = "Bạn không có quyền sửa hoặc bài viết không tồn tại" });
        return NoContent(); 
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var userId = GetCurrentUserId();
        var success = await _postsService.DeletePostAsync(id, userId);
        
        if (!success) return BadRequest(new { message = "Bạn không có quyền xóa hoặc bài viết không tồn tại" });
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idClaim, out Guid userId) ? userId : Guid.Empty;
    }
}