using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Services.Implementation;

public class ShareService : IShareService
{
    private readonly IGenericRepository<Share> _shareRepo;
    private readonly IGenericRepository<Post> _postRepo;
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public ShareService (
        IGenericRepository<Share> shareRepo, 
        IGenericRepository<Post> postRepo, 
        ApplicationDbContext context,
        INotificationService notificationService)
    {
        _shareRepo = shareRepo;
        _postRepo = postRepo;
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<int> GetShareCountAsync(Guid postId)
    {
        var shares = await _shareRepo.GetAllAsync();
        return shares.Count(s => s.PostId == postId && s.DeletedAt == null);
    }

    public async Task<bool> SharePostAsync(Guid userId, CreateShareDTO request)
    {
        var originalPost = await _postRepo.GetByIdAsync(request.PostId);
        if(originalPost == null || originalPost.Status == Status.deleted) throw new Exception("Post not found");

        // 1. Lưu bản ghi vào bảng Shares (để đếm số lượng share)
        var shareRecord = new Share
        {
            Id = Guid.NewGuid(),
            PostId = request.PostId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        await _shareRepo.AddAsync(shareRecord);

        // 2. Tạo một Post mới (Shared Post) để hiển thị trên Newfeed của bạn bè
        var sharedPost = new Post
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Content = request.Content ?? "", // Lời nhắn khi share
            Visibility = Visibility.Public,  // Mặc định share là Public hoặc lấy từ request
            Status = Status.active,
            OriginalPostId = request.PostId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.Posts.AddAsync(sharedPost);

        await _context.SaveChangesAsync();

        // 3. Gửi thông báo cho chủ bài viết gốc
        try
        {
            var sender = await _context.Users.FindAsync(userId);
            await _notificationService.CreateNotificationAsync(new DTOs.Notifications.CreateNotificationDTO
            {
                UserId = originalPost.UserId,
                ActorId = userId,
                Content = $"{sender?.FullName ?? "Ai đó"} đã chia sẻ bài viết của bạn.",
                Type = NotificationType.Share
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ShareService] Gửi thông báo thất bại: {ex.Message}");
        }

        return true;
    }

    public async Task<List<UserBasicDto>> GetSharersAsync(Guid postId, int skip, int take)
    {
        return await _context.Shares
            .Where(s => s.PostId == postId && s.DeletedAt == null)
            .Include(s => s.User)
            .OrderByDescending(s => s.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(s => new UserBasicDto
            {
                Id = s.User!.Id,
                FullName = s.User.FullName,
                Email = s.User.Email ?? "",
                AvatarUrl = s.User.AvatarUrl,
                Bio = s.User.Bio
            })
            .ToListAsync();
    }
}