namespace InteractHub.Api.DTOs.Admin;

public class ActivityLogDTO
{
    public Guid Id { get; set; }
    public Guid AdminId { get; set; }
    public string AdminName { get; set; } = null!;
    public string AdminEmail { get; set; } = null!;

    public string Action { get; set; } = null!;
    public string ActionCategory { get; set; } = null!;
    public string Severity { get; set; } = null!;

    public Guid? TargetUserId { get; set; }
    public string? TargetUserName { get; set; }
    public string? TargetUserEmail { get; set; }

    public Guid? TargetPostId { get; set; }
    public Guid? TargetReportId { get; set; }

    public string? Reason { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class ActivityLogListResponseDTO
{
    public List<ActivityLogDTO> Data { get; set; } = new();
    public int Total { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
}

public class ActivityLogStatsDTO
{
    public int TotalLogs { get; set; }
    public int CriticalLogs { get; set; }
    public int WarningLogs { get; set; }
    public int UserActionLogs { get; set; }
    public int PostActionLogs { get; set; }
    public int ReportActionLogs { get; set; }
}
