
namespace InteractHub.Api.DTOs.User_Handle
{
    public class UserResponseDTO
    {
        public Guid Id {get;set;}
        public string Email {get;set;} = null!;
        public string FullName {get;set;} = null!;
        public string? Location {get;set;}
        public string? AvatarUrl {get;set;}
        public string? Bio {get;set;}
        public DateTime DateOfBirth {get;set;}
        public string Gender {get;set;} = null!;
        public IList<string> Roles {get;set;} = new List<string>();
        public bool IsLockedOut {get;set;}  // Status of the user account
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
        public DateTime? SuspendedUntil { get; set; }
        public DateTime? BannedAt { get; set; }

        // Settings
        public bool EmailNotifications { get; set; }
        public bool PushNotifications { get; set; }
        public bool PrivateAccount { get; set; }
        public bool ShowOnlineStatus { get; set; }
        public string WhoCanComment { get; set; } = "Everyone";
        public string WhoCanSendFriendRequest { get; set; } = "Everyone";
        public string WhoCanSeeFriendsList { get; set; } = "Everyone";
    }
}