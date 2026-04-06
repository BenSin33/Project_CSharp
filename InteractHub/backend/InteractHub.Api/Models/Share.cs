public class Share :BaseEntity
{
    public string ShareContent {get;set;}
    public string UserId  {get;set;}
    public virtual User user {get;set;}
    public int PostId {get;set;}
    public virtual Post Post {get;set;}
}