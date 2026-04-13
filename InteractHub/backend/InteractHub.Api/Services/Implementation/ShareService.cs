using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class ShareService : IShareService
{
    private readonly IGenericRepository<Share> _shareRepo;
    private readonly IGenericRepository<Post> _postRepo;

    public ShareService (IGenericRepository<Share> shareRepo, IGenericRepository<Post> postRepo)
    {
        _shareRepo = shareRepo;
        _postRepo = postRepo;
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
            DeletedAt = DateTime.UtcNow
        };

        await _shareRepo.AddAsync(share);
        await _shareRepo.SaveChangesAsync();
        return true;
    }   
}