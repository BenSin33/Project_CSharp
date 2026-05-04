using InteractHub.Api.Models;
using InteractHub.Api.DTOs.Post;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Services.Implementation;

public class SavedPostService : ISavedPostService
{
    private readonly IGenericRepository<SavedPost> _savedPostRepository;
    private readonly ApplicationDbContext _context;
    private readonly IPostService _postService;

    public SavedPostService(
        IGenericRepository<SavedPost> savedPostRepository, 
        ApplicationDbContext context,
        IPostService postService)
    {
        _savedPostRepository = savedPostRepository;
        _context = context;
        _postService = postService;
    }

    /// <summary>
    /// Save a post for the current user
    /// </summary>
    public async Task<SavedPostResponseDto?> SavePostAsync(Guid userId, Guid postId)
    {
        // Check if post exists
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId && p.Status != Status.deleted);
        if (post == null) return null;

        // Check if already saved
        var existing = await _context.SavedPosts.FirstOrDefaultAsync(sp => sp.UserId == userId && sp.PostId == postId);
        if (existing != null)
        {
            // Already saved, just return it
            return new SavedPostResponseDto
            {
                Id = existing.Id,
                UserId = existing.UserId,
                PostId = existing.PostId,
                CreatedAt = existing.CreatedAt,
                UpdatedAt = existing.UpdatedAt
            };
        }

        // Create new saved post
        var savedPost = new SavedPost
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PostId = postId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _savedPostRepository.AddAsync(savedPost);
        await _savedPostRepository.SaveChangesAsync();

        return new SavedPostResponseDto
        {
            Id = savedPost.Id,
            UserId = savedPost.UserId,
            PostId = savedPost.PostId,
            CreatedAt = savedPost.CreatedAt,
            UpdatedAt = savedPost.UpdatedAt
        };
    }

    /// <summary>
    /// Unsave (remove bookmark) a post for the current user
    /// </summary>
    public async Task<bool> UnsavePostAsync(Guid userId, Guid postId)
    {
        var savedPost = await _context.SavedPosts.FirstOrDefaultAsync(sp => sp.UserId == userId && sp.PostId == postId);
        if (savedPost == null) return false;

        _savedPostRepository.Delete(savedPost);
        await _savedPostRepository.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Get all saved posts for a user with pagination and full post data
    /// </summary>
    public async Task<PaginatedResponse<PostResponseDto>> GetUserSavedPostsAsync(Guid userId, int skip, int take, Guid? currentUserId = null)
    {
        var query = _context.SavedPosts
            .Where(sp => sp.UserId == userId)
            .OrderByDescending(sp => sp.CreatedAt)
            .Include(sp => sp.Post)!
                .ThenInclude(p => p.User)
            .Include(sp => sp.Post)!
                .ThenInclude(p => p.PostMedias)
            .Include(sp => sp.Post)!
                .ThenInclude(p => p.Comments)
                .ThenInclude(c => c.User)
            .Include(sp => sp.Post)!
                .ThenInclude(p => p.Likes)
                .ThenInclude(l => l.User)
            .Include(sp => sp.Post)!
                .ThenInclude(p => p.Shares)
            .AsNoTracking();

        var total = await query.CountAsync();
        var savedPosts = await query
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        // Convert SavedPost entities to PostResponseDto using PostService's mapping logic
        var postDtos = new List<PostResponseDto>();
        foreach (var sp in savedPosts)
        {
            if (sp.Post != null)
            {
                var postDto = await _postService.GetPostByIdAsync(sp.PostId, currentUserId);
                if (postDto != null)
                {
                    postDtos.Add(postDto);
                }
            }
        }

        return new PaginatedResponse<PostResponseDto>
        {
            Data = postDtos,
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    /// <summary>
    /// Check if a post is saved by the current user
    /// </summary>
    public async Task<bool> IsPostSavedAsync(Guid userId, Guid postId)
    {
        return await _context.SavedPosts.AnyAsync(sp => sp.UserId == userId && sp.PostId == postId);
    }
}
