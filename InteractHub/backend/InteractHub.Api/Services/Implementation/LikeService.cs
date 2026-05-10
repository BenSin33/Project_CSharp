using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Services.Implementation;
public class LikeService : ILikeService
{
    private readonly IGenericRepository<Like> _likeRepo;
    private readonly IGenericRepository<Post> _postRepo;
    private readonly ApplicationDbContext _context;

    public LikeService(IGenericRepository<Like> likeRepo, IGenericRepository<Post> postRepo, ApplicationDbContext context)
    {
        _likeRepo = likeRepo;
        _postRepo = postRepo;
        _context = context;
    }

    public async Task<LikeSummaryDTO> GetLikeSummaryAsync(Guid postId, Guid? currentUserId = null)
    {
        var postLikes = await _context.Likes
            .Where(l => l.PostId == postId)
            .Include(l => l.User)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        var summary = new LikeSummaryDTO
        {
            TotalLikes = postLikes.Count,
            ReactionCounts = postLikes.GroupBy(l => l.Type).ToDictionary(g => g.Key.ToString(), g => g.Count()),
            TopLikes = postLikes.Take(10).Select(l => new LikePreviewDto
            {
                Id = l.Id,
                ReactionType = l.Type.ToString(),
                CreatedAt = l.CreatedAt,
                User = l.User != null ? new UserBasicDto
                {
                    Id = l.User.Id,
                    FullName = l.User.FullName,
                    Email = l.User.Email ?? "",
                    AvatarUrl = l.User.AvatarUrl,
                    Bio = l.User.Bio
                } : null
            }).ToList()
        };

        if (currentUserId.HasValue)
        {
            var userLike = postLikes.FirstOrDefault(l => l.UserId == currentUserId.Value);
            summary.CurrentUserReaction = userLike?.Type;
        }

        return summary;
    }

    public async Task<bool> ToggleLikeAsync (Guid userId, ToggleLikeDTO request)
    {
        var post = await _postRepo.GetByIdAsync(request.PostId);
        if(post == null || post.Status == Status.deleted)
        {
            throw new Exception ("Post not found or has been deleted.");
        }

        var allLikes = await _likeRepo.GetAllAsync();
        var existingLike = allLikes.FirstOrDefault(l => l.PostId == request.PostId && l.UserId == userId);

        if(existingLike != null)
        {
            if(existingLike.Type == request.Type)
            {
                _likeRepo.Delete(existingLike);
            }
            else
            {
                existingLike.Type = request.Type;
                existingLike.UpdatedAt = DateTime.UtcNow;
                _likeRepo.Update(existingLike);
            }
        }
        else
        {
            var newLike = new Like
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PostId = request.PostId,
                Type = request.Type,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _likeRepo.AddAsync(newLike);
        }

        await _likeRepo.SaveChangesAsync();
        return true;
    }

    public async Task<List<LikeDetailDto>> GetLikersAsync(Guid postId, int skip, int take)
    {
        return await _context.Likes
            .Where(l => l.PostId == postId)
            .Include(l => l.User)
            .OrderByDescending(l => l.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(l => new LikeDetailDto
            {
                Id = l.Id,
                PostId = l.PostId,
                ReactionType = l.Type.ToString(),
                CreatedAt = l.CreatedAt,
                User = l.User != null ? new UserBasicDto
                {
                    Id = l.User.Id,
                    FullName = l.User.FullName,
                    Email = l.User.Email ?? "",
                    AvatarUrl = l.User.AvatarUrl,
                    Bio = l.User.Bio
                } : null
            })
            .ToListAsync();
    }
}