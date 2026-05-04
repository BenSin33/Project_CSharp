using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Data;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class AdminDashboardService : IAdminDashboardService
{
    private readonly ApplicationDbContext _context;

    public AdminDashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDTO> GetDashboardStatsAsync()
    {
        var currentMonth = DateTime.UtcNow.AddMonths(-1);
        var currentDay = DateTime.UtcNow.AddDays(-1);

        var stats = new DashboardStatsDTO
        {
            // User Stats
            TotalUsers = await _context.Users.CountAsync(),
            NewUsersThisMonth = await _context.Users.CountAsync(u => u.CreatedAt >= currentMonth),
            LockedUsers = await _context.Users.CountAsync(u => u.LockoutEnd != null && u.LockoutEnd > DateTime.UtcNow),

            // Content Stats
            TotalPosts = await _context.Posts.CountAsync(),
            NewPostsThisMonth = await _context.Posts.CountAsync(p => p.CreatedAt >= currentMonth),
            DeletedPosts = await _context.Posts.CountAsync(p => p.Status == Status.deleted),
            HiddenPosts = await _context.Posts.CountAsync(p => p.Status == Status.hidden),

            // Report Stats
            PendingReports = await _context.PostReports.CountAsync(r => r.ReportStatus == ReportStatus.Pending),
            ReviewedReports = await _context.PostReports.CountAsync(r => r.ReportStatus == ReportStatus.Reviewed),
            ResolvedReports = await _context.PostReports.CountAsync(r => r.ReportStatus == ReportStatus.Resolved),
            TotalReports = await _context.PostReports.CountAsync(),

            // Engagement Stats
            TotalComments = await _context.Comments.CountAsync(),
            TotalLikes = await _context.Likes.CountAsync(),
            TotalShares = await _context.Shares.CountAsync(),

            GeneratedAt = DateTime.UtcNow
        };

        // Calculate active users (who created posts this month)
        stats.ActiveUsersThisMonth = await _context.Posts
            .Where(p => p.CreatedAt >= currentMonth)
            .Select(p => p.UserId)
            .Distinct()
            .CountAsync();

        return stats;
    }

    public async Task<AdminDashboardDTO> GetAdminDashboardAsync()
    {
        var dashboard = new AdminDashboardDTO
        {
            Stats = await GetDashboardStatsAsync(),
            RecentActivity = await GetRecentActivityAsync(20),
            PendingActions = await GetPendingActionsAsync()
        };

        return dashboard;
    }

    public async Task<List<RecentActivityDTO>> GetRecentActivityAsync(int count = 20)
    {
        var activities = new List<RecentActivityDTO>();

        // Recent new users
        var newUsers = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(count / 4)
            .ToListAsync();

        foreach (var user in newUsers)
        {
            activities.Add(new RecentActivityDTO
            {
                Id = Guid.NewGuid(),
                Type = "NewUser",
                Description = $"New user registered: {user.FullName}",
                Timestamp = user.CreatedAt,
                RelatedUserId = user.Id
            });
        }

        // Recent reports
        var reports = await _context.PostReports
            .Include(r => r.Post)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count / 4)
            .ToListAsync();

        foreach (var report in reports)
        {
            activities.Add(new RecentActivityDTO
            {
                Id = Guid.NewGuid(),
                Type = "NewReport",
                Description = $"New report filed: {report.ReportType}",
                Timestamp = report.CreatedAt,
                RelatedPostId = report.PostId
            });
        }

        // Recent posts
        var posts = await _context.Posts
            .OrderByDescending(p => p.CreatedAt)
            .Take(count / 4)
            .ToListAsync();

        foreach (var post in posts)
        {
            activities.Add(new RecentActivityDTO
            {
                Id = Guid.NewGuid(),
                Type = "NewPost",
                Description = $"New post created",
                Timestamp = post.CreatedAt,
                RelatedPostId = post.Id
            });
        }

        return activities.OrderByDescending(a => a.Timestamp).Take(count).ToList();
    }

    public async Task<List<PendingActionDTO>> GetPendingActionsAsync()
    {
        var actions = new List<PendingActionDTO>();

        // Pending reports
        var pendingReports = await _context.PostReports
            .Where(r => r.ReportStatus == ReportStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .ToListAsync();

        foreach (var report in pendingReports)
        {
            actions.Add(new PendingActionDTO
            {
                Id = report.Id,
                ActionType = "Report",
                Title = $"Report #{report.Id}",
                Description = $"{report.ReportType}: {report.Reason}",
                Priority = 1, // High
                CreatedAt = report.CreatedAt
            });
        }

        // Locked users (potential appeals)
        var lockedUsers = await _context.Users
            .Where(u => u.LockoutEnd != null && u.LockoutEnd > DateTime.UtcNow)
            .OrderByDescending(u => u.LockoutEnd)
            .Take(3)
            .ToListAsync();

        foreach (var user in lockedUsers)
        {
            actions.Add(new PendingActionDTO
            {
                Id = Guid.NewGuid(),
                ActionType = "Appeal",
                Title = $"User Appeal - {user.FullName}",
                Description = $"User account locked until {user.LockoutEnd}",
                Priority = 2, // Medium
                CreatedAt = DateTime.UtcNow
            });
        }

        return actions.OrderByDescending(a => a.Priority).ToList();
    }

    public async Task<List<TopReportedPostDTO>> GetTopReportedPostsAsync(int count = 10)
    {
        var topPosts = await _context.PostReports
            .GroupBy(r => r.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(count)
            .ToListAsync();

        var result = new List<TopReportedPostDTO>();

        foreach (var item in topPosts)
        {
            var post = await _context.Posts.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == item.PostId);
            if (post != null)
            {
                result.Add(new TopReportedPostDTO
                {
                    PostId = post.Id,
                    PostContent = post.Content ?? "[Content removed]",
                    AuthorName = post.User?.FullName ?? "Unknown",
                    ReportCount = item.Count,
                    CreatedAt = post.CreatedAt
                });
            }
        }

        return result;
    }

    public async Task<UserActivitySummaryDTO> GetUserActivitySummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var week = today.AddDays(-7);
        var month = today.AddMonths(-1);

        var summary = new UserActivitySummaryDTO
        {
            UsersCreatedToday = await _context.Users.CountAsync(u => u.CreatedAt.Date == today),
            UsersCreatedThisWeek = await _context.Users.CountAsync(u => u.CreatedAt >= week),
            UsersCreatedThisMonth = await _context.Users.CountAsync(u => u.CreatedAt >= month),
            PostsCreatedToday = await _context.Posts.CountAsync(p => p.CreatedAt.Date == today),
            PostsCreatedThisWeek = await _context.Posts.CountAsync(p => p.CreatedAt >= week),
            PostsCreatedThisMonth = await _context.Posts.CountAsync(p => p.CreatedAt >= month),
        };

        var totalUsers = await _context.Users.CountAsync();
        var totalPosts = await _context.Posts.CountAsync();

        summary.AveragePostsPerUser = totalUsers > 0 ? (double)totalPosts / totalUsers : 0;

        return summary;
    }

    public async Task LogAdminActionAsync(Guid adminId, string action, string description, Guid? relatedUserId = null, Guid? relatedPostId = null)
    {
        // TODO: Implement AuditLog table and logging
        // For now, this is a placeholder
        await Task.CompletedTask;
    }

    public async Task<SystemHealthMetricsDTO> GetSystemHealthMetricsAsync()
    {
        // TODO: Implement real system health metrics
        var metrics = new SystemHealthMetricsDTO
        {
            ActiveConnections = await _context.Users.CountAsync(u => u.LockoutEnd == null),
            DiskUsagePercent = 45.5, // Mock value
            MemoryUsagePercent = 62.3, // Mock value
            DatabaseConnectionPoolSize = 20,
            PendingBackgroundJobs = 3,
            LastBackupTime = DateTime.UtcNow.AddHours(-1),
            LastHealthCheckTime = DateTime.UtcNow
        };

        return metrics;
    }
}
