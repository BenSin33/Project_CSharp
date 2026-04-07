namespace InteractHub.Api.Models;

public class Share : BaseEntity
{
    public Guid UserId {get;set;} // Foreign key to User
    public Guid PostId {get;set;} // Foreign key to Post
    public virtual User? User {get;set;} // Navigation property to User
    public virtual Post? Post {get;set;} // Navigation property to Post
}