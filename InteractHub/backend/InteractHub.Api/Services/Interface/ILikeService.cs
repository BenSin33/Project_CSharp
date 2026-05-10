using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services.Interface;
public interface ILikeService
{
    Task<LikeSummaryDTO> GetLikeSummaryAsync(Guid postId, Guid? currentUserId = null);
    Task<bool> ToggleLikeAsync (Guid userId, ToggleLikeDTO request);
    Task<List<LikeDetailDto>> GetLikersAsync(Guid postId, int skip, int take);
}