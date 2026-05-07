using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Controllers;

[Route("api/admin/activity-logs")]
[ApiController]
[Authorize(Roles = "Admin")]
public class ActivityLogController : ControllerBase
{
    private readonly IActivityLogService _activityLogService;

    public ActivityLogController(IActivityLogService activityLogService)
    {
        _activityLogService = activityLogService;
    }

    /// <summary>
    /// Get all activity logs (Admin only)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetActivityLogs(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        [FromQuery] string? category = null,
        [FromQuery] string? action = null,
        [FromQuery] string? severity = null)
    {
        if (skip < 0 || take <= 0)
        {
            return BadRequest(ApiResponse<ActivityLogListResponseDTO>.Fail("Skip must be >= 0 and Take must be > 0"));
        }

        try
        {
            var logs = await _activityLogService.GetActivityLogsAsync(skip, take, category, action, severity);
            return Ok(ApiResponse<ActivityLogListResponseDTO>.Ok(logs, "Activity logs retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get activity log statistics (Admin only)
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetActivityStats()
    {
        try
        {
            var stats = await _activityLogService.GetActivityStatsAsync();
            return Ok(ApiResponse<ActivityLogStatsDTO>.Ok(stats, "Activity stats retrieved"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get activity logs for a specific user (Admin only)
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserActivityLogs(Guid userId, [FromQuery] int take = 10)
    {
        try
        {
            var logs = await _activityLogService.GetUserActivityLogsAsync(userId, take);
            return Ok(ApiResponse<List<ActivityLogDTO>>.Ok(logs, "User activity logs retrieved"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }
}
