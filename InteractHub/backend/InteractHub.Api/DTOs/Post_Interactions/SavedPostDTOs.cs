using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.DTOs.Post_Interactions;

/// <summary>
/// Request DTO for saving/bookmarking a post
/// </summary>
public class SavePostDto
{
    [Required]
    public Guid PostId { get; set; }
}

/// <summary>
/// Response DTO for saved post (contains post details)
/// </summary>
public class SavedPostResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PostId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
