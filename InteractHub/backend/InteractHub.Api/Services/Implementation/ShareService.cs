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

    public ShareService (IGenericRepository<Share> shareRepo, IGenericRepository<Post> postRepo, ApplicationDbContext context)
    {
        _shareRepo = shareRepo;
        _postRepo = postRepo;
        _context = context;
    }

    public async Task<int> GetShareCountAsync(Guid postId)
    {
        var shares = await _shareRepo.GetAllAsync();
        return shares.Count(s => s.PostId == postId && s.DeletedAt == null);
    }

    public async Task<bool> SharePostAsync(Guid userId, CreateShareDTO request)
    {
        var post = await _postRepo.GetByIdAsync(request.PostId);
        if(post == null || post.Status == Status.deleted) throw new Exception("Post not found");

        var share = new Share
        {
            Id =Guid.NewGuid(),
            PostId = request.PostId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        await _shareRepo.AddAsync(share);
        await _shareRepo.SaveChangesAsync();
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