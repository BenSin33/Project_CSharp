using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace InteractHub.Api.Models;

public class User : IdentityUser<Guid>
{
    [Required]
    [StringLength(200)]
    public string FullName {get;set;} = null!; // Full name of the user
    public string? Location {get;set;}
    public string? AvatarUrl {get;set;}
    [StringLength(1000)]
    public string? Bio {get;set;}
    public DateTime DateOfBirth {get;set;}
    public Gender Gender {get;set;}
    public virtual ICollection<Post> Posts{get; set;} = new List<Post>(); // Navigation property to Posts
    public virtual ICollection<FriendShip> Friendships {get;set;} = new List<FriendShip>(); // Navigation property to Friendships
    public virtual ICollection<Message> SentMessages {get;set;} = new List<Message>(); // Navigation property to sent Messages
    public virtual ICollection<Message> ReceivedMessages {get;set;} = new List<Message>(); // Navigation property to received Messages
}

public enum Gender
{
    male, female, other
}
