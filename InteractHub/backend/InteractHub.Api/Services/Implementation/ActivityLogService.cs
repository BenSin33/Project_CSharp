using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Data;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class ActivityLogService : IActivityLogService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ActivityLogService> _logger;

    public ActivityLogService(ApplicationDbContext context, ILogger<ActivityLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ActivityLog> LogActivityAsync(Guid adminId, string action, string category,
        string? reason = null, Guid? targetUserId = null, Guid? targetPostId = null,
        Guid? targetReportId = null, string? oldValue = null, string? newValue = null,
        string severity = "Info", string? ipAddress = null)
    {
        try
        {
            var activityLog = new ActivityLog
            {
                AdminId = adminId,
                Action = action,
                ActionCategory = category,
                Reason = reason,
                TargetUserId = targetUserId,
                TargetPostId = targetPostId,
                TargetReportId = targetReportId,
                OldValue = oldValue,
                NewValue = newValue,
                Severity = severity,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            _context.ActivityLogs.Add(activityLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Activity logged: {action} by admin {adminId} on {category}");
            return activityLog;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error logging activity: {ex.Message}");
            throw;
        }
    }

    public async Task<ActivityLogListResponseDTO> GetActivityLogsAsync(int skip = 0, int take = 20,
        string? category = null, string? action = null, string? severity = null)
    {
        var query = _context.ActivityLogs
            .Include(al => al.Admin)
            .Include(al => al.TargetUser)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(al => al.ActionCategory == category);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(al => al.Action == action);

        if (!string.IsNullOrEmpty(severity))
            query = query.Where(al => al.Severity == severity);

        var total = await query.CountAsync();

        var logs = await query
            .OrderByDescending(al => al.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(al => new ActivityLogDTO
            {
                Id = al.Id,
                AdminId = al.AdminId,
                AdminName = al.Admin!.FullName,
                AdminEmail = al.Admin!.Email ?? "",
                Action = al.Action,
                ActionCategory = al.ActionCategory,
                Severity = al.Severity,
                TargetUserId = al.TargetUserId,
                TargetUserName = al.TargetUser != null ? al.TargetUser.FullName : null,
                TargetUserEmail = al.TargetUser != null ? al.TargetUser.Email : null,
                TargetPostId = al.TargetPostId,
                TargetReportId = al.TargetReportId,
                Reason = al.Reason,
                OldValue = al.OldValue,
                NewValue = al.NewValue,
                IpAddress = al.IpAddress,
                CreatedAt = al.CreatedAt
            })
            .ToListAsync();

        return new ActivityLogListResponseDTO
        {
            Data = logs,
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    public async Task<ActivityLogStatsDTO> GetActivityStatsAsync()
    {
        var query = _context.ActivityLogs.AsQueryable();

        return new ActivityLogStatsDTO
        {
            TotalLogs = await query.CountAsync(),
            CriticalLogs = await query.CountAsync(al => al.Severity == "Critical"),
            WarningLogs = await query.CountAsync(al => al.Severity == "Warning"),
            UserActionLogs = await query.CountAsync(al => al.ActionCategory == "User"),
            PostActionLogs = await query.CountAsync(al => al.ActionCategory == "Post"),
            ReportActionLogs = await query.CountAsync(al => al.ActionCategory == "Report")
        };
    }

    public async Task<List<ActivityLogDTO>> GetUserActivityLogsAsync(Guid userId, int take = 10)
    {
        var logs = await _context.ActivityLogs
            .Include(al => al.Admin)
            .Include(al => al.TargetUser)
            .Where(al => al.TargetUserId == userId)
            .OrderByDescending(al => al.CreatedAt)
            .Take(take)
            .Select(al => new ActivityLogDTO
            {
                Id = al.Id,
                AdminId = al.AdminId,
                AdminName = al.Admin!.FullName,
                AdminEmail = al.Admin!.Email ?? "",
                Action = al.Action,
                ActionCategory = al.ActionCategory,
                Severity = al.Severity,
                TargetUserId = al.TargetUserId,
                TargetUserName = al.TargetUser != null ? al.TargetUser.FullName : null,
                TargetUserEmail = al.TargetUser != null ? al.TargetUser.Email : null,
                TargetPostId = al.TargetPostId,
                TargetReportId = al.TargetReportId,
                Reason = al.Reason,
                OldValue = al.OldValue,
                NewValue = al.NewValue,
                IpAddress = al.IpAddress,
                CreatedAt = al.CreatedAt
            })
            .ToListAsync();

        return logs;
    }
}
