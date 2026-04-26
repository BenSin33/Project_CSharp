using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs.User_Handle
{
    public class AssignRoleDTO 
    {
        [Required]  
        public string RoleName {get;set;} = null!;
    }
    
}