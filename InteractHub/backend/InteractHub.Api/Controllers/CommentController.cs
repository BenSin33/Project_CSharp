using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace InteractHub.Api.Controllers;

[Route("api/[Controller]")]
[ApiController]
[Authorize]
public class CommentController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet("post/{postId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(Guid postId)
    {
        var comments = await _commentService.GetCommentsByPostIdAsync(postId);
        return Ok(ApiResponse<IEnumerable<CommentResponseDTO>>.Ok(comments));

    }

    [HttpPost]
    public async Task<IActionResult> AddComment([FromBody] CreateCommentDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select( e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Invalid request", errors));

        }
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value); // Get the user ID from the JWT token

        // try catch block to handle potential exceptions from the service layer (e.g., post not found, database errors, etc.)
        try
        {
            var comment = await _commentService.AddCommentAsync(userId, request);
            return Ok(ApiResponse<CommentResponseDTO>.Ok(comment, "Comment added successfully"));
        }
        catch (Exception ex)
        {
            return NotFound(ApiResponse<string>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var isDeleted = await _commentService.DeleteCommentAsync(id, userId);
        if (!isDeleted)
        {
            return BadRequest(ApiResponse<bool>.Fail("Failed to delete comment. You may not have permission or the comment may not exist."));
        }
        return Ok(ApiResponse<bool>.Ok(true, "Comment deleted successfully"));
    }

}