public class Notification : BaseEntity
{
    public string Content {get;set;}
    public bool IsRead {get;set;} = false;
    public string type {get;set;} // e.g., "FriendRequest", "Like", "Comment"
    public string UserId {get;set;} // The user who receives the notification
    public virtual User user {get;set;}  
}