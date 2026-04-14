using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs.User_Handle
{
    public class UpdateUserDTO
    {
        [Required(ErrorMessage ="FullName is required")]
        [StringLength(200)]
        public string FullName {get;set;} = null!;

        public string?Location {get;set;}
        public string? AvatarUrl {get;set;}
        
        [StringLength(1000)]
        public string? Bio {get;set;}

        public DateTime DateOfBirth {get;set;}
        public Gender Gender {get;set;}
    }
}