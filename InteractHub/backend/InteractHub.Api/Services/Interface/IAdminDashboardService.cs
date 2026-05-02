using InteractHub.Api.DTOs.Admin;

namespace InteractHub.Api.Services.Interface;

public interface IAdminDashboardService
{
    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    Task<DashboardStatsDTO> GetDashboardStatsAsync();

    /// <summary>
    /// Get full admin dashboard with stats and recent activity
    /// </summary>
    Task<AdminDashboardDTO> GetAdminDashboardAsync();

    /// <summary>
    /// Get recent activities
    /// </summary>
    Task<List<RecentActivityDTO>> GetRecentActivityAsync(int count = 20);

    /// <summary>
    /// Get pending actions that need admin attention
    /// </summary>
    Task<List<PendingActionDTO>> GetPendingActionsAsync();

    /// <summary>
    /// Get top reported posts
    /// </summary>
    Task<List<TopReportedPostDTO>> GetTopReportedPostsAsync(int count = 10);

    /// <summary>
    /// Get user activity summary
    /// </summary>
    Task<UserActivitySummaryDTO> GetUserActivitySummaryAsync();

    /// <summary>
    /// Log an admin action for audit trail
    /// </summary>
    Task LogAdminActionAsync(Guid adminId, string action, string description, Guid? relatedUserId = null, Guid? relatedPostId = null);

    /// <summary>
    /// Get system health metrics
    /// </summary>
    Task<SystemHealthMetricsDTO> GetSystemHealthMetricsAsync();
}

public class SystemHealthMetricsDTO
{
    public int ActiveConnections { get; set; }
    public double DiskUsagePercent { get; set; }
    public double MemoryUsagePercent { get; set; }
    public int DatabaseConnectionPoolSize { get; set; }
    public int PendingBackgroundJobs { get; set; }
    public DateTime LastBackupTime { get; set; }
    public DateTime LastHealthCheckTime { get; set; }
}
