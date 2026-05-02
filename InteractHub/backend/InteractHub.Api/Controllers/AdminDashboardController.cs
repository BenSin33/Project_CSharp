using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Controllers;

[Route("api/admin/dashboard")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminDashboardService _dashboardService;

    public AdminDashboardController(IAdminDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Get complete admin dashboard (Admin only)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        try
        {
            var dashboard = await _dashboardService.GetAdminDashboardAsync();
            return Ok(ApiResponse<AdminDashboardDTO>.Ok(dashboard, "Dashboard retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get dashboard statistics only (Admin only)
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        try
        {
            var stats = await _dashboardService.GetDashboardStatsAsync();
            return Ok(ApiResponse<DashboardStatsDTO>.Ok(stats, "Statistics retrieved successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get recent activities (Admin only)
    /// </summary>
    [HttpGet("recent-activity")]
    public async Task<IActionResult> GetRecentActivity([FromQuery] int count = 20)
    {
        if (count <= 0 || count > 100)
        {
            return BadRequest(ApiResponse<List<RecentActivityDTO>>.Fail("Count must be between 1 and 100"));
        }

        try
        {
            var activities = await _dashboardService.GetRecentActivityAsync(count);
            return Ok(ApiResponse<List<RecentActivityDTO>>.Ok(activities, "Recent activities retrieved"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get pending actions requiring admin attention (Admin only)
    /// </summary>
    [HttpGet("pending-actions")]
    public async Task<IActionResult> GetPendingActions()
    {
        try
        {
            var actions = await _dashboardService.GetPendingActionsAsync();
            return Ok(ApiResponse<List<PendingActionDTO>>.Ok(actions, "Pending actions retrieved"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get top reported posts (Admin only)
    /// </summary>
    [HttpGet("top-reported-posts")]
    public async Task<IActionResult> GetTopReportedPosts([FromQuery] int count = 10)
    {
        if (count <= 0 || count > 50)
        {
            return BadRequest(ApiResponse<List<TopReportedPostDTO>>.Fail("Count must be between 1 and 50"));
        }

        try
        {
            var posts = await _dashboardService.GetTopReportedPostsAsync(count);
            return Ok(ApiResponse<List<TopReportedPostDTO>>.Ok(posts, "Top reported posts retrieved"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get user activity summary (Admin only)
    /// </summary>
    [HttpGet("user-activity")]
    public async Task<IActionResult> GetUserActivity()
    {
        try
        {
            var activity = await _dashboardService.GetUserActivitySummaryAsync();
            return Ok(ApiResponse<UserActivitySummaryDTO>.Ok(activity, "User activity summary retrieved"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get system health metrics (Admin only)
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetSystemHealth()
    {
        try
        {
            var health = await _dashboardService.GetSystemHealthMetricsAsync();
            return Ok(ApiResponse<SystemHealthMetricsDTO>.Ok(health, "System health metrics retrieved"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }
}
