namespace InteractHub.Api.Models;

public class Post : BaseEntity
{
    public string? Content {get;set;}
    public string? MediaUrl {get;set;} 
    public Visibility Visibility {get;set;}
    public Guid UserId {get;set;} // Foreign key to User
    public Status Status {get;set;}  // Active, Deleted, Hidden
    public virtual User? User {get;set;} // Navigation property to User
    public virtual ICollection<PostMedia> PostMedias {get;set;} = new List<PostMedia>();
    public virtual ICollection<HashTag> HashTags {get;set;} = new List<HashTag>();
    public virtual ICollection<Comment> Comments {get;set;} = new List<Comment>();
    public virtual ICollection<Like> Likes {get;set;} = new List<Like>();
    public virtual ICollection<Share> Shares {get;set;} = new List<Share>();
}

public enum Status
{
    active, deleted, hidden
}

public enum Visibility
{
    Public , Friends, Private
}

