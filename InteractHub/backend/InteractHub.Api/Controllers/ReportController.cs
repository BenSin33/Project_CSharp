using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Models;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Create a new report for a post (User-facing)
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Validation failed", errors));
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var reporterId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var report = await _reportService.CreateReportAsync(reporterId, request.PostId, request);
            return CreatedAtAction(nameof(GetReportById), new { id = report.Id }, 
                ApiResponse<ReportResponseDTO>.Ok(report, "Report created successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Get all reports (Admin only)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllReports([FromQuery] int skip = 0, [FromQuery] int take = 20, [FromQuery] ReportStatus? status = null)
    {
        if (skip < 0 || take <= 0)
        {
            return BadRequest(ApiResponse<ReportsListResponseDTO>.Fail("Skip must be >= 0 and Take must be > 0"));
        }

        var reports = await _reportService.GetAllReportsAsync(skip, take, status);
        return Ok(ApiResponse<ReportsListResponseDTO>.Ok(reports, "Reports retrieved successfully"));
    }

    /// <summary>
    /// Get report by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetReportById(Guid id)
    {
        var report = await _reportService.GetReportByIdAsync(id);
        if (report == null)
            return NotFound(ApiResponse<ReportResponseDTO>.Fail("Report not found"));

        return Ok(ApiResponse<ReportResponseDTO>.Ok(report));
    }

    /// <summary>
    /// Get reports for a specific post (Admin only)
    /// </summary>
    [HttpGet("post/{postId}")]
    public async Task<IActionResult> GetReportsByPost(Guid postId)
    {
        var reports = await _reportService.GetReportsByPostIdAsync(postId);
        return Ok(ApiResponse<List<ReportResponseDTO>>.Ok(reports, $"Found {reports.Count} reports"));
    }

    /// <summary>
    /// Update report status (Admin only)
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateReportStatus(Guid id, [FromBody] UpdateReportStatusDTO request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Validation failed", errors));
        }

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var adminId))
            {
                return Unauthorized(ApiResponse<string>.Fail("User not authenticated"));
            }

            var result = await _reportService.UpdateReportStatusAsync(id, adminId, request);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Report not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Report status updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Delete a report (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReport(Guid id)
    {
        var result = await _reportService.DeleteReportAsync(id);
        if (!result)
            return NotFound(ApiResponse<bool>.Fail("Report not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Report deleted successfully"));
    }

    /// <summary>
    /// Get report statistics (Admin only)
    /// </summary>
    [HttpGet("stats/summary")]
    public async Task<IActionResult> GetReportStats()
    {
        var (pending, reviewed, resolved) = await _reportService.GetReportStatsAsync();
        
        var stats = new
        {
            pending,
            reviewed,
            resolved,
            total = pending + reviewed + resolved
        };

        return Ok(ApiResponse<object>.Ok(stats, "Report statistics retrieved"));
    }

    /// <summary>
    /// Get top reported posts (Admin only)
    /// </summary>
    [HttpGet("top-reported")]
    public async Task<IActionResult> GetTopReportedPosts([FromQuery] int count = 10)
    {
        if (count <= 0 || count > 50)
        {
            return BadRequest(ApiResponse<List<TopReportedPostDTO>>.Fail("Count must be between 1 and 50"));
        }

        var posts = await _reportService.GetTopReportedPostsAsync(count);
        return Ok(ApiResponse<List<TopReportedPostDTO>>.Ok(posts, "Top reported posts retrieved"));
    }
}
