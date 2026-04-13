namespace InteractHub.Api.Models;

public class Like : BaseEntity
{
    public Guid UserId {get;set;} // Foreign key to User
    public Guid PostId {get;set;} // Foreign key to Post
    public LikeType Type {get;set;} // Type of like (e.g., LIKE, LOVE, HAHA, etc.)
    public virtual User? User {get;set;} // Navigation property to User
    public virtual Post? Post {get;set;} // Navigation property to Post
}

public enum LikeType
{
    LIKE, LOVE, HAHA, WOW, SAD, ANGRY
}