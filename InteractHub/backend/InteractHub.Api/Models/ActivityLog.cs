namespace InteractHub.Api.Models;

public class ActivityLog : BaseEntity
{
    public Guid AdminId { get; set; }
    public User? Admin { get; set; }

    public string Action { get; set; } = null!;  // "BanUser", "DeletePost", etc.
    public string ActionCategory { get; set; } = null!;  // "User", "Post", "Report"

    // Target IDs - only one should be populated based on action
    public Guid? TargetUserId { get; set; }
    public User? TargetUser { get; set; }

    public Guid? TargetPostId { get; set; }
    public Guid? TargetReportId { get; set; }

    // Details
    public string? Reason { get; set; }          // Lý do ban/xóa
    public string? OldValue { get; set; }        // Giá trị cũ (cho update operations)
    public string? NewValue { get; set; }        // Giá trị mới
    public string? IpAddress { get; set; }       // IP của admin
    public string? UserAgent { get; set; }       // Browser/client info

    // Severity level
    public string Severity { get; set; } = "Info";  // Info, Warning, Critical
}

public enum ActivityActionType
{
    // User Actions
    BanUser,
    UnbanUser,
    SuspendUser,
    UnsuspendUser,
    DeleteUser,
    LockUser,
    UnlockUser,
    AssignRole,
    RemoveRole,

    // Post Actions
    DeletePost,
    HidePost,
    UnhidePost,

    // Report Actions
    ApproveReport,
    DismissReport,
    UpdateReportStatus,

    // Other
    AdminLogin,
    AdminLogout,
    SecuritySettingChanged
}
