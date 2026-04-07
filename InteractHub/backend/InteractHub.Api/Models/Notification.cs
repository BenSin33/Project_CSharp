namespace InteractHub.Api.Models;

public class Notification : BaseEntity
{
	public string Content {get;set;} = null!;
    public NotificationType Type {get;set;}
	public bool IsRead {get;set;} = false;
	public Guid UserId {get;set;} // Foreign key to User
	public virtual User? User {get;set;} // Navigation property to User
}

public enum NotificationType
{
    Like, Comment, Share, 
    Message, FriendRequest, FriendAccept, 
    PostMention, CommentMention, FriendPost
}

