namespace InteractHub.Api.DTOs.Admin;

/// <summary>
/// Statistics for admin dashboard
/// </summary>
public class DashboardStatsDTO
{
    // User Stats
    public int TotalUsers { get; set; }
    public int NewUsersThisMonth { get; set; }
    public int ActiveUsersThisMonth { get; set; }
    public int LockedUsers { get; set; }
    
    // Content Stats
    public int TotalPosts { get; set; }
    public int NewPostsThisMonth { get; set; }
    public int DeletedPosts { get; set; }
    public int HiddenPosts { get; set; }
    
    // Report Stats
    public int PendingReports { get; set; }
    public int ReviewedReports { get; set; }
    public int ResolvedReports { get; set; }
    public int TotalReports { get; set; }
    
    // Engagement Stats
    public int TotalComments { get; set; }
    public int TotalLikes { get; set; }
    public int TotalShares { get; set; }
    
    // Timestamp
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Recent activity items for dashboard
/// </summary>
public class RecentActivityDTO
{
    public Guid Id { get; set; }
    public string Type { get; set; } = null!; // "NewUser", "NewReport", "UserLocked", "PostDeleted"
    public string Description { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public Guid? RelatedUserId { get; set; }
    public Guid? RelatedPostId { get; set; }
}

/// <summary>
/// Dashboard overview combining stats and recent activity
/// </summary>
public class AdminDashboardDTO
{
    public DashboardStatsDTO Stats { get; set; } = new();
    public List<RecentActivityDTO> RecentActivity { get; set; } = new();
    public List<PendingActionDTO> PendingActions { get; set; } = new();
}

/// <summary>
/// Pending actions that need admin attention
/// </summary>
public class PendingActionDTO
{
    public Guid Id { get; set; }
    public string ActionType { get; set; } = null!; // "Report", "Appeal", "Notification"
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int Priority { get; set; } // 1 = High, 2 = Medium, 3 = Low
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Top reported posts
/// </summary>
public class TopReportedPostDTO
{
    public Guid PostId { get; set; }
    public string PostContent { get; set; } = null!;
    public string AuthorName { get; set; } = null!;
    public int ReportCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// User activity summary
/// </summary>
public class UserActivitySummaryDTO
{
    public int UsersCreatedToday { get; set; }
    public int UsersCreatedThisWeek { get; set; }
    public int UsersCreatedThisMonth { get; set; }
    public int PostsCreatedToday { get; set; }
    public int PostsCreatedThisWeek { get; set; }
    public int PostsCreatedThisMonth { get; set; }
    public double AveragePostsPerUser { get; set; }
}
