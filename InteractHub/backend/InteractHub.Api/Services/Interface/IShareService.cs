using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Common;

namespace InteractHub.Api.Services.Interface;
public interface IShareService
{
    Task<bool> SharePostAsync(Guid userId, CreateShareDTO request);
    Task<int> GetShareCountAsync(Guid postId);
    Task<List<UserBasicDto>> GetSharersAsync(Guid postId, int skip, int take);
}