using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Models;

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
}