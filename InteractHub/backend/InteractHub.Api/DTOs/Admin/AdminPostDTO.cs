using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs.Admin;

/// <summary>
/// DTO for admin to manage/delete posts
/// </summary>
public class AdminDeletePostDTO
{
    public string Reason { get; set; } = null!;
    public string? AdminNotes { get; set; }
}

/// <summary>
/// DTO for updating post visibility
/// </summary>
public class UpdatePostVisibilityDTO
{
    public Visibility NewVisibility { get; set; }
    public string? AdminNotes { get; set; }
}

/// <summary>
/// DTO for updating post status (hide/unhide/delete)
/// </summary>
public class UpdatePostStatusDTO
{
    public Status NewStatus { get; set; }
    public string Reason { get; set; } = null!;
    public string? AdminNotes { get; set; }
}

/// <summary>
/// Admin view of post details
/// </summary>
public class AdminPostDetailDTO
{
    public Guid Id { get; set; }
    public string? Content { get; set; }
    public string Visibility { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Author info
    public Guid AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorEmail { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    
    // Stats
    public int CommentCount { get; set; }
    public int LikeCount { get; set; }
    public int ShareCount { get; set; }
    public int ReportCount { get; set; }
    
    // Admin actions
    public bool IsReported { get; set; }
    public List<string>? ReportReasons { get; set; }
    public string? AdminNotes { get; set; }
    public Guid? ActionTakenByAdminId { get; set; }
    public string? ActionTakenByAdminName { get; set; }
    public DateTime? ActionTakenAt { get; set; }
}

/// <summary>
/// Bulk post management request
/// </summary>
public class BulkPostActionDTO
{
    public List<Guid> PostIds { get; set; } = new();
    public string Action { get; set; } = null!; // "delete", "hide", "unhide"
    public string Reason { get; set; } = null!;
    public string? AdminNotes { get; set; }
}

/// <summary>
/// Content flagged by automated system
/// </summary>
public class FlaggedContentDTO
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public string FlagReason { get; set; } = null!; // "spam", "inappropriate", "duplicate", "hate-speech"
    public double ConfidenceScore { get; set; } // 0.0 - 1.0
    public DateTime FlaggedAt { get; set; }
    public bool Reviewed { get; set; }
    public string? AdminAction { get; set; }
}
