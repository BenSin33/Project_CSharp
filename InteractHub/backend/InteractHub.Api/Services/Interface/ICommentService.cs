using InteractHub.Api.DTOs.Post_Interactions;

namespace InteractHub.Api.Services.Interface;

public interface ICommentService
{
    Task<IEnumerable<CommentResponseDTO>> GetCommentsByPostIdAsync (Guid postId);
    Task<CommentResponseDTO> AddCommentAsync(Guid userId, CreateCommentDTO request);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId);
}