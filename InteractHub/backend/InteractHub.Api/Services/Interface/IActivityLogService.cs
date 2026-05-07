using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services.Interface;

public interface IActivityLogService
{
    Task<ActivityLog> LogActivityAsync(Guid adminId, string action, string category, 
        string? reason = null, Guid? targetUserId = null, Guid? targetPostId = null, 
        Guid? targetReportId = null, string? oldValue = null, string? newValue = null,
        string severity = "Info", string? ipAddress = null);

    Task<ActivityLogListResponseDTO> GetActivityLogsAsync(int skip = 0, int take = 20, 
        string? category = null, string? action = null, string? severity = null);

    Task<ActivityLogStatsDTO> GetActivityStatsAsync();

    Task<List<ActivityLogDTO>> GetUserActivityLogsAsync(Guid userId, int take = 10);
}
