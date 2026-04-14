using System.Security.Claims;
using InteractHub.Api.DTOs.Story;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class StoryController : ControllerBase
{
    private readonly IStoryService _storyService;

    public StoryController(IStoryService storyService)
    {
        _storyService = storyService;
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveStories()
    {
        var stories = await _storyService.GetActiveStoriesAsync();
        return Ok(ApiResponse<IEnumerable<StoryResponseDTO>>.Ok(stories, "Stories retrieved successfully."));
    }

    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserActiveStories(Guid userId)
    {
        var stories = await _storyService.GetUserActiveStoriesAsync(userId);
        return Ok(ApiResponse<IEnumerable<StoryResponseDTO>>.Ok(stories, "User stories retrieved successfully."));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateStory([FromBody] CreateStoryDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<StoryResponseDTO>.Fail("Validation failed", errors));
        }

        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(ApiResponse<StoryResponseDTO>.Fail("Invalid user token"));
        }

        var story = await _storyService.CreateStoryAsync(userId, request);
        return Ok(ApiResponse<StoryResponseDTO>.Ok(story, "Story created successfully."));
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteStory(Guid id)
    {
        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(ApiResponse<bool>.Fail("Invalid user token"));
        }

        var deleted = await _storyService.DeleteStoryAsync(id, userId);
        if (!deleted)
        {
            return NotFound(ApiResponse<bool>.Fail("Story not found or no permission."));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Story deleted successfully."));
    }
}
