using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Common;

namespace InteractHub.Api.DTOs.Post;

public class PostResponseDto
{
    public Guid Id {get;set;}
    public Guid UserId {get;set;}
    public string? Content {get;set;}
    public string? Visibility {get;set;}
    public string? Status {get;set;} // Active, Deleted, etc.
    public DateTime CreatedAt {get;set;}
    public DateTime UpdatedAt {get;set;}
    public List<PostMediaDto> MediaItems {get;set;} = new List<PostMediaDto>();
    
    // New fields: Aggregated interaction data
    public UserBasicDto? Author { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
    public bool IsSavedByCurrentUser { get; set; }
    
    // Like summary with top likers
    public LikeSummaryDTO? LikeSummary { get; set; }
    
    // Top comments with user details
    public List<CommentDetailDto> TopComments { get; set; } = new List<CommentDetailDto>();

    // Hashtags
    public List<string> HashTags { get; set; } = new List<string>();
}