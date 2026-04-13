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