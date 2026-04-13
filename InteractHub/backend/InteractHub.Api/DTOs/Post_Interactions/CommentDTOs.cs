using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.DTOs.Post_Interactions;

public class CreateCommentDTO
{
    [Required]
    public Guid PostId {get;set;}

    [Required(ErrorMessage = "Content is required.")]
    [StringLength(1000)]
    public string Content {get;set;} = null!;
}

public class CommentResponseDTO
{
    public Guid Id {get;set;}
    public Guid UserId{get;set;}
    public Guid PostId {get;set;}
    public string Content{get;set;} = null!;
    public DateTime CreatedAt{get;set;}
    public DateTime UpdatedAt{get;set;}
}

