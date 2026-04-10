using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Models;

public class Story : BaseEntity
{
    [StringLength(500)]
    public string? StoryContent {get;set;}
    [Required]
    [StringLength(500)]
    public string MediaUrl {get;set;} = null!;
    public DateTime ExpireAt {get;set;} = DateTime.UtcNow.AddHours(24);
    public Guid UserId {get;set;} // Foreign key to User
    public virtual User? User {get;set;} // Navigation property to User
}