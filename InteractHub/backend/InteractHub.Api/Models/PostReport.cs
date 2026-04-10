using System.ComponentModel.DataAnnotations;
namespace InteractHub.Api.Models;

public class PostReport : BaseEntity
{
    [Required(ErrorMessage = " Reason is required")]
    public string? Reason {get;set;}
    public ReportType ReportType {get;set;}
    public ReportStatus ReportStatus {get;set;} = ReportStatus.Pending;  // default value
    public Guid UserId {get;set;} // Foreign key to User
    public Guid PostId {get;set;} // Foreign key to Post
    public virtual User? User {get;set;} // Navigation property to User
    public virtual Post? Post {get;set;} // Navigation property to Post
}

public enum ReportType
{
    Spam, InvalidContent, Harassment, Other
}

public enum ReportStatus
{
    Pending, Reviewed, Resolved
}