using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Models;
using System.Security.Claims;
using InteractHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Controllers;

[Route("api/[Controller]")]
[ApiController]
[Authorize]
public class CommentController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _context;

    public CommentController(ICommentService commentService, INotificationService notificationService, ApplicationDbContext context)
    {
        _commentService = commentService;
        _notificationService = notificationService;
        _context = context;
    }

    [HttpGet("post/{postId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(Guid postId)
    {
        var comments = await _commentService.GetCommentsByPostIdAsync(postId);
        return Ok(ApiResponse<IEnumerable<CommentDetailDto>>.Ok(comments));
    }

    [HttpPost]
    public async Task<IActionResult> AddComment([FromBody] CreateCommentDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Invalid request", errors));
        }
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        try
        {
            var comment = await _commentService.AddCommentAsync(userId, request);

            // Create notification for post owner
            try
            {
                var post = await _context.Posts
                    .FirstOrDefaultAsync(p => p.Id == request.PostId && p.Status != Status.deleted);

                if (post != null && post.UserId != userId)
                {
                    var actor = await _context.Users.FindAsync(userId);
                    var actorName = actor?.FullName ?? "Someone";

                    await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                    {
                        Content = $"{actorName} đã bình luận về bài viết của bạn",
                        Type = NotificationType.Comment,
                        UserId = post.UserId,
                        ActorId = userId
                    });
                }
            }
            catch { /* notification failure should not block comment */ }

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
            return BadRequest(ApiResponse<bool>.Fail("Failed to delete comment. You may not have permission or the comment may not exist."));

        return Ok(ApiResponse<bool>.Ok(true, "Comment deleted successfully"));
    }
}