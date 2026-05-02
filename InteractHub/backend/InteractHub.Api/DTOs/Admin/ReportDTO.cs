using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs.Admin;

/// <summary>
/// DTO for creating a new report (User-facing)
/// </summary>
public class CreateReportDTO
{
    public string Reason { get; set; } = null!;
    public ReportType ReportType { get; set; }
    public Guid PostId { get; set; }
}

/// <summary>
/// DTO for updating report status (Admin-only)
/// </summary>
public class UpdateReportStatusDTO
{
    public ReportStatus Status { get; set; }
    public string? AdminNotes { get; set; }
}

/// <summary>
/// DTO for displaying report details
/// </summary>
public class ReportResponseDTO
{
    public Guid Id { get; set; }
    public string Reason { get; set; } = null!;
    public ReportType ReportType { get; set; }
    public ReportStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // User who reported
    public Guid ReporterId { get; set; }
    public string? ReporterName { get; set; }
    public string? ReporterEmail { get; set; }
    
    // Post that was reported
    public Guid PostId { get; set; }
    public string? PostContent { get; set; }
    public Guid PostAuthorId { get; set; }
    public string? PostAuthorName { get; set; }
    
    // Admin action
    public string? AdminNotes { get; set; }
    public Guid? ResolvedByAdminId { get; set; }
    public string? ResolvedByAdminName { get; set; }
}

/// <summary>
/// DTO for paginated reports list
/// </summary>
public class ReportsListResponseDTO
{
    public List<ReportResponseDTO> Reports { get; set; } = new();
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Reviewed { get; set; }
    public int Resolved { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
}
