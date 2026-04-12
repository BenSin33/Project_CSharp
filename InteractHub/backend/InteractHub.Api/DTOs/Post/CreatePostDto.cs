using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs.Post;

public class CreatePostDto
{
    [Required(ErrorMessage =  "User ID is required")]
    public Guid UserId{get;set;}
    
    [StringLength(2000, ErrorMessage = "Content cannot exceed 2000 characters.")]
    public string? Content {get;set;}

    public Visibility Visibility {get;set;}

}

