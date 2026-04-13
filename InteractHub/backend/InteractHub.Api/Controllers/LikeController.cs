using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Models;
using System.Security.Claims;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LikeController : ControllerBase
{
    private readonly ILikeService _likeService;
    
    public LikeController(ILikeService likeService)
    {
        _likeService = likeService;
    }

    [HttpGet("post/{postId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLikeSummary(Guid postId)
    {
        Guid? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim))
        {
            currentUserId = Guid.Parse(userIdClaim);
        }
        var summary = await _likeService.GetLikeSummaryAsync(postId, currentUserId);
        return Ok(ApiResponse<LikeSummaryDTO>.Ok(summary));
    }

    [HttpPost("toggle")]
    public async Task<IActionResult> ToggleLike([FromBody] ToggleLikeDTO request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<bool>.Fail("Invalid request"));
        } 
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        try
        {
            var result = await _likeService.ToggleLikeAsync(userId, request);
            return Ok(ApiResponse<bool>.Ok(result, "Like toggled successfully"));
        }
        catch(Exception ex)
        {
            return NotFound(ApiResponse<bool>.Fail(ex.Message));
        }
    }

}