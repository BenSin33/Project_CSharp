using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.DTOs.Story;

public class CreateStoryDTO
{
    [StringLength(500)]
    public string? StoryContent { get; set; }

    [Required(ErrorMessage = "MediaUrl is required")]
    [StringLength(500)]
    public string MediaUrl { get; set; } = null!;
}

public class StoryResponseDTO
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? StoryContent { get; set; }
    public string MediaUrl { get; set; } = null!;
    public DateTime ExpireAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
