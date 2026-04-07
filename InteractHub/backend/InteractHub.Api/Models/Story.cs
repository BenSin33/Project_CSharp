namespace InteractHub.Api.Models;

public class Story : BaseEntity
{
    public string? StoryContent {get;set;}
    public string MediaUrl {get;set;} = null!;
    public DateTime ExpireAt {get;set;} = DateTime.UtcNow.AddHours(24);
    public Guid UserId {get;set;} // Foreign key to User
    public virtual User? User {get;set;} // Navigation property to User
}