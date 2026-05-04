namespace InteractHub.Api.Models;

/// <summary>
/// Represents a post saved (bookmarked) by a user
/// </summary>
public class SavedPost : BaseEntity
{
    public Guid UserId { get; set; }  // FK to User
    public Guid PostId { get; set; }  // FK to Post

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Post? Post { get; set; }
}
