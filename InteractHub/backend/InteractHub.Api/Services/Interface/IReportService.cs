using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services.Interface;

public interface IReportService
{
    /// <summary>
    /// Create a new report for a post
    /// </summary>
    Task<ReportResponseDTO> CreateReportAsync(Guid reporterId, Guid postId, CreateReportDTO request);

    /// <summary>
    /// Get all reports with optional filtering
    /// </summary>
    Task<ReportsListResponseDTO> GetAllReportsAsync(int skip = 0, int take = 20, ReportStatus? status = null);

    /// <summary>
    /// Get report by ID
    /// </summary>
    Task<ReportResponseDTO?> GetReportByIdAsync(Guid reportId);

    /// <summary>
    /// Get reports for a specific post
    /// </summary>
    Task<List<ReportResponseDTO>> GetReportsByPostIdAsync(Guid postId);

    /// <summary>
    /// Get reports by a specific user
    /// </summary>
    Task<List<ReportResponseDTO>> GetReportsByReporterIdAsync(Guid reporterId);

    /// <summary>
    /// Update report status (Admin only)
    /// </summary>
    Task<bool> UpdateReportStatusAsync(Guid reportId, Guid adminId, UpdateReportStatusDTO request);

    /// <summary>
    /// Delete a report (Admin only)
    /// </summary>
    Task<bool> DeleteReportAsync(Guid reportId);

    /// <summary>
    /// Get report statistics
    /// </summary>
    Task<(int pending, int reviewed, int resolved)> GetReportStatsAsync();

    /// <summary>
    /// Get top reported posts
    /// </summary>
    Task<List<TopReportedPostDTO>> GetTopReportedPostsAsync(int count = 10);
}
