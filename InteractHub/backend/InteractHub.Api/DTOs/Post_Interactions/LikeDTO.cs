using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs.Common;

namespace InteractHub.Api.DTOs.Post_Interactions;

public class ToggleLikeDTO
{
    [Required]
    public Guid PostId {get;set;}
    public LikeType Type {get;set;}
}

public class LikeSummaryDTO
{
    public int TotalLikes{get;set;}
    public Dictionary<string,int> ReactionCounts {get;set;} = new();  // return a dictionary of reaction type and count
    public LikeType? CurrentUserReaction {get;set;}
    public List<LikePreviewDto> TopLikes { get; set; } = new List<LikePreviewDto>(); // First 10 likers with user details
}

/// <summary>
/// Preview of a like (for showing top likers)
/// </summary>
public class LikePreviewDto
{
    public Guid Id { get; set; }
    public UserBasicDto? User { get; set; }
    public string ReactionType { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Full like detail with pagination support
/// </summary>
public class LikeDetailDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public UserBasicDto? User { get; set; }
    public string ReactionType { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}