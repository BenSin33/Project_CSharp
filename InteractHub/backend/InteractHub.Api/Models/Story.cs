public class Story : BaseEntity
{
    public string MediaUrl {get;set;}
    public DateTime ExpiredAt {get; set;} = DateTime.UtcNow.AddHours(24); // Stories expire after 24 hours
    public string UserId {get;set;}
    public virtual User user {get;set;}
}