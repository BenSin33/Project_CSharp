using InteractHub.Api.Repositories;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Models;
using Microsoft.Identity.Client;

namespace InteractHub.Api.Services.Implementation;

public class CommentService : ICommentService
{
    private readonly IGenericRepository<Comment> _commentRepo;
    private readonly IGenericRepository<Post> _postRepo;

    public CommentService(IGenericRepository<Comment> commentRepo, IGenericRepository<Post> postRepo)
    {
        _commentRepo = commentRepo;
        _postRepo = postRepo;
    }

    public async Task<IEnumerable<CommentResponseDTO>> GetCommentsByPostIdAsync(Guid postId)
    {
        var comments = await _commentRepo.GetAllAsync();
        return comments.Where(c => c.PostId == postId && c.DeletedAt == null )
            .OrderByDescending(c => c.CreatedAt).Select(c => new CommentResponseDTO
            {
                Id = c.Id,
                PostId = c.PostId,
                UserId = c.UserId,
                Content = c.Content!,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });
    }

    public async Task<CommentResponseDTO> AddCommentAsync(Guid userId, CreateCommentDTO request)
    {
        var post = await _postRepo.GetByIdAsync(request.PostId);
        if(post == null || post.Status == Status.deleted) throw new Exception("Post not found or has been deleted.");

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = request.PostId,
            UserId = userId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = DateTime.UtcNow
        };
        await _commentRepo.AddAsync(comment);
        await _commentRepo.SaveChangesAsync();

        return new CommentResponseDTO
        {
            Id = comment.Id,
            PostId = comment.PostId,
            UserId = comment.UserId,
            Content = comment.Content!,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _commentRepo.GetByIdAsync(commentId);
        if(comment == null || comment.UserId != userId ||comment.DeletedAt != null) return false;

        comment.DeletedAt = DateTime.UtcNow;
        _commentRepo.Update(comment);

        await _commentRepo.SaveChangesAsync();
        return true;
    }

}