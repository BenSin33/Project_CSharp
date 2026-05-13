using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace InteractHub.Api.Models;

public class User : IdentityUser<Guid>
{
    public DateTime CreatedAt {get;set;} = DateTime.UtcNow;
    [Required]
    [StringLength(200)]
    public string FullName {get;set;} = null!; // Full name of the user
    public string? Location {get;set;}
    public string? AvatarUrl {get;set;}
    [StringLength(1000)]
    public string? Bio {get;set;}
    public DateTime DateOfBirth {get;set;}
    public Gender Gender {get;set;}
    
    // User Status Management
    public UserStatus Status { get; set; } = UserStatus.Active;
    public DateTime? SuspendedUntil { get; set; }  // When suspension ends (null = not suspended)
    public string? SuspensionReason { get; set; }
    public string? BanReason { get; set; }
    public DateTime? BannedAt { get; set; }        // When user was banned
    
    // Preferences & Privacy Settings
    public bool EmailNotifications { get; set; } = true;
    public bool PushNotifications { get; set; } = true;
    public bool PrivateAccount { get; set; } = false;
    public bool ShowOnlineStatus { get; set; } = true;
    public string WhoCanComment { get; set; } = "Everyone";
    public string WhoCanSendFriendRequest { get; set; } = "Everyone";
    public string WhoCanSeeFriendsList { get; set; } = "Everyone";

    public virtual ICollection<Post> Posts{get; set;} = new List<Post>(); // Navigation property to Posts
    public virtual ICollection<FriendShip> Friendships {get;set;} = new List<FriendShip>(); // Navigation property to Friendships
    public virtual ICollection<Message> SentMessages {get;set;} = new List<Message>(); // Navigation property to sent Messages
    public virtual ICollection<Message> ReceivedMessages {get;set;} = new List<Message>(); // Navigation property to received Messages
    public virtual ICollection<ActivityLog> ActivityLogs {get;set;} = new List<ActivityLog>(); // Admin actions performed
}

public enum Gender
{
    male, female, other
}
