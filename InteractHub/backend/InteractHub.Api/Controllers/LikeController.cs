using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Notifications;
using InteractHub.Api.Models;
using System.Security.Claims;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LikeController : ControllerBase
{
    private readonly ILikeService _likeService;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _context;

    public LikeController(ILikeService likeService, INotificationService notificationService, ApplicationDbContext context)
    {
        _likeService = likeService;
        _notificationService = notificationService;
        _context = context;
    }

    [HttpGet("post/{postId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLikeSummary(Guid postId)
    {
        Guid? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim))
            currentUserId = Guid.Parse(userIdClaim);

        var summary = await _likeService.GetLikeSummaryAsync(postId, currentUserId);
        return Ok(ApiResponse<LikeSummaryDTO>.Ok(summary));
    }

    [HttpGet("post/{postId}/users")]
    public async Task<IActionResult> GetPostLikers(Guid postId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var users = await _likeService.GetLikersAsync(postId, skip, take);
        return Ok(ApiResponse<List<LikeDetailDto>>.Ok(users, "Likers retrieved successfully"));
    }

    [HttpPost("toggle")]
    public async Task<IActionResult> ToggleLike([FromBody] ToggleLikeDTO request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<bool>.Fail("Invalid request"));

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        try
        {
            var result = await _likeService.ToggleLikeAsync(userId, request);

            // Create notification for post owner (only when liking, not unliking)
            try
            {
                var post = await _context.Posts
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == request.PostId && p.Status != Status.deleted);

                if (post != null && post.UserId != userId)
                {
                    var actor = await _context.Users.FindAsync(userId);
                    var actorName = actor?.FullName ?? "Someone";

                    await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                    {
                        Content = $"{actorName} đã thích bài viết của bạn",
                        Type = NotificationType.Like,
                        UserId = post.UserId,
                        ActorId = userId
                    });
                }
            }
            catch { /* notification failure should not block like */ }

            return Ok(ApiResponse<bool>.Ok(result, "Like toggled successfully"));
        }
        catch (Exception ex)
        {
            return NotFound(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}