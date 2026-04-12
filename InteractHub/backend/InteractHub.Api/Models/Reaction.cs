namespace InteractHub.Api.Models;

public class Reaction : BaseEntity
{
    public Guid UserId {get;set;} // Foreign key to User
    public Guid PostId {get;set;} // Foreign key to Post
    public ReactType Type {get;set;} = ReactType.LIKE;// Type of reaction (LIKE, LOVE, HAHA, etc.)
    public virtual User? User {get;set;} // Navigation property to User
    public virtual Post? Post {get;set;} // Navigation property to Post
}

public enum ReactType
{
    LIKE, LOVE, HAHA, WOW, SAD, ANGRY
} 


