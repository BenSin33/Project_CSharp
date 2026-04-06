public class Comment: BaseEntity
{
    public string CommentContent {get;set;}
    public string UserId {get;set;}
    public virtual User user {get;set;}
    public int PostId {get;set;}
    public virtual Post Post {get;set;}
}