using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Models;
using System.Security.Claims;
using InteractHub.Api.DTOs.Common;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ShareController : ControllerBase
{
    private readonly IShareService _shareService;

    public ShareController(IShareService shareService)
    {
        _shareService = shareService;
    } 

    [HttpGet("post/{postId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetShareCount (Guid postId)
    {
        var count = await _shareService.GetShareCountAsync(postId);
        return Ok(ApiResponse<int>.Ok(count));   
    }

    [HttpGet("post/{postId}/users")]
    public async Task<IActionResult> GetPostSharers(Guid postId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var users = await _shareService.GetSharersAsync(postId, skip, take);
        return Ok(ApiResponse<List<UserBasicDto>>.Ok(users, "Sharers retrieved successfully"));
    }

    [HttpPost]
    public async Task<IActionResult> SharPost([FromBody] CreateShareDTO request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<string>.Fail("Invalid request"));
        }

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        try
        {
            var result = await _shareService.SharePostAsync(userId, request);
            return Ok(ApiResponse<bool>.Ok(result, "Post shared successfully"));
        }
        catch(Exception ex)
        {
            return NotFound(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}