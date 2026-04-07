namespace InteractHub.Api.Models;

public class PostMedia : BaseEntity
{
    public string Url {get;set;} = null!;
    public MediaType MediaType {get;set;}
    public Guid PostId {get;set;} // Foreign key to Post
    public virtual Post? Post {get;set;} // Navigation property to Post
}

public enum MediaType
{
    image, video, story
}