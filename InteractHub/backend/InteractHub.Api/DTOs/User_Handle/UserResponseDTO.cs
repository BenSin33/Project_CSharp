
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
    }
}