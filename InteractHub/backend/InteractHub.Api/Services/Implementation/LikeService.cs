using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;
public class LikeService : ILikeService
{
    private readonly IGenericRepository<Like> _likeRepo;
    private readonly IGenericRepository<Post> _postRepo;

    public LikeService(IGenericRepository<Like> likeRepo, IGenericRepository<Post> postRepo)
    {
        _likeRepo = likeRepo;
        _postRepo = postRepo;
    }

    public async Task<LikeSummaryDTO> GetLikeSummaryAsync(Guid postId, Guid? currentUserId = null)
    {
        var allLikes = await _likeRepo.GetAllAsync();
        var postLikes = allLikes.Where(l => l.PostId == postId).ToList();

        var summary = new LikeSummaryDTO
        {
            TotalLikes = postLikes.Count,
            ReactionCounts = postLikes.GroupBy(l => l.Type).ToDictionary(g => g.Key.ToString(), g => g.Count())
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

}