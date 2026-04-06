using Microsoft.AspNetCore.Identity;

public class User : IdentityUser<int>
{
    public string GivenName {get;set;}
    public string Surname {get;set;}
    public string? Country {get;set;}
    public DateTime DateOfBirth {get;set;}
    public string? AvatarUrl {get;set;}

    public virtual ICollection<FriendShip> SentFriendRequests {get;set;}
    public virtual ICollection<FriendShip> ReceivedFriendRquests {get; set;}
    public virtual ICollection<Post> Posts {get;set;}

}