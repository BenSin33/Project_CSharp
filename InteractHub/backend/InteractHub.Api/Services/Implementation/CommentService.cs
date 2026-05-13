using InteractHub.Api.Repositories;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Models;
using InteractHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Services.Implementation;

public class CommentService : ICommentService
{
    private readonly IGenericRepository<Comment> _commentRepo;
    private readonly IGenericRepository<Post> _postRepo;
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    
    public CommentService(
        IGenericRepository<Comment> commentRepo, 
        IGenericRepository<Post> postRepo,
        ApplicationDbContext context,
        INotificationService notificationService)
    {
        _commentRepo = commentRepo;
        _postRepo = postRepo;
        _context = context; 
        _notificationService = notificationService;
    }

     public async Task<IEnumerable<CommentDetailDto>> GetCommentsByPostIdAsync(Guid postId)
    {
        return await _context.Comments
            .Where(c => c.PostId == postId && c.DeletedAt == null)
            .Include(c => c.User)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentDetailDto
            {
                Id = c.Id,
                PostId = c.PostId,
                Content = c.Content!,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                User = c.User != null ? new UserBasicDto
                {
                    Id = c.User.Id,
                    FullName = c.User.FullName,
                    Email = c.User.Email ?? "",
                    AvatarUrl = c.User.AvatarUrl,
                    Bio = c.User.Bio
                } : null
            })
            .ToListAsync();
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
        };
        await _commentRepo.AddAsync(comment);
        await _commentRepo.SaveChangesAsync();

        // Gửi thông báo cho chủ bài viết
        try
        {
            var sender = await _context.Users.FindAsync(userId);
            await _notificationService.CreateNotificationAsync(new DTOs.Notifications.CreateNotificationDTO
            {
                UserId = post.UserId,
                ActorId = userId,
                Content = $"{sender?.FullName ?? "Ai đó"} đã bình luận về bài viết của bạn: \"{request.Content}\"",
                Type = NotificationType.Comment
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CommentService] Gửi thông báo thất bại: {ex.Message}");
        }

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