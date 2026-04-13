using InteractHub.Api.DTOs.Post_Interactions;

namespace InteractHub.Api.Services.Interface;
public interface IShareService
{
    Task<bool> SharePostAsync(Guid userId, CreateShareDTO request);
    Task<int> GetShareCountAsync(Guid postId);
}