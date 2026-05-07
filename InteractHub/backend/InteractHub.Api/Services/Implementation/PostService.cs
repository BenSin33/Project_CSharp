using InteractHub.Api.Models;
using InteractHub.Api.DTOs.Post;
using InteractHub.Api.DTOs.Post_Interactions;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Services.Implementation;

public class PostService : IPostService
{
    private readonly IGenericRepository<Post> _postRepository;
    private readonly ApplicationDbContext _context;

    public PostService(IGenericRepository<Post> postRepository, ApplicationDbContext context)
    {
        _postRepository = postRepository;
        _context = context;
    }

    public async Task<IEnumerable<PostResponseDto>> GetAllActivePostsAsync()
    {
        var posts = await _postRepository.GetAllAsync();
        return posts.Where(p => p.Status == Status.active).Select(p => MapToResponseDto(p, null, false)); // No aggregated data in this legacy method
    }

    /// <summary>
    /// Get all active posts with pagination and aggregated interaction data
    /// </summary>
    public async Task<PaginatedResponse<PostResponseDto>> GetAllActivePostsAsync(int skip, int take, Guid? currentUserId = null)
    {
        var query = _context.Posts
            .Where(p => p.Status == Status.active)
            .Include(p => p.User)
            .Include(p => p.PostMedias)
            .Include(p => p.HashTags)
            .Include(p => p.Comments).ThenInclude(c => c.User)
            .Include(p => p.Likes).ThenInclude(l => l.User)
            .Include(p => p.Shares)
            .AsNoTracking();

        var total = await query.CountAsync();
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        // Get saved posts for current user if provided
        var savedPostIds = new HashSet<Guid>();

        if (currentUserId.HasValue)
        {
            var postIds = posts.Select(p => p.Id).ToList(); // ← materialize trước
            if (postIds.Any()) // ← guard: chỉ query khi có posts
            {
                savedPostIds = (await _context.SavedPosts
                    .Where(sp => sp.UserId == currentUserId.Value && postIds.Contains(sp.PostId))
                    .Select(sp => sp.PostId)
                    .ToListAsync()).ToHashSet();
            }
        }

        var result = new PaginatedResponse<PostResponseDto>
        {
            Data = posts.Select(p => MapToResponseDto(p, currentUserId, savedPostIds.Contains(p.Id))).ToList(),
            Total = total,
            Skip = skip,
            Take = take
        };

        return result;
    }

    /// <summary>
    /// Get single post with all aggregated data
    /// </summary>
    public async Task<PostResponseDto?> GetPostByIdAsync(Guid id, Guid? currentUserId = null)
    {
        var post = await _context.Posts
            .Where(p => p.Id == id && p.Status != Status.deleted)
            .Include(p => p.User)
            .Include(p => p.PostMedias)
            .Include(p => p.HashTags)
            .Include(p => p.Comments)
                .ThenInclude(c => c.User)
            .Include(p => p.Likes)
                .ThenInclude(l => l.User)
            .Include(p => p.Shares)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (post == null) return null;

        // Check if saved by current user
        var isSaved = false;
        if (currentUserId.HasValue)
        {
            isSaved = await _context.SavedPosts.AnyAsync(sp => sp.UserId == currentUserId.Value && sp.PostId == id);
        }

        return MapToResponseDto(post, currentUserId, isSaved);
    }

    /// <summary>
    /// Search posts by content, hashtags, or author name
    /// </summary>
    public async Task<PaginatedResponse<PostResponseDto>> SearchPostsAsync(string query, int skip, int take, Guid? currentUserId = null)
    {
        var searchQuery = query.ToLower();

        var postQuery = _context.Posts
            .Where(p => p.Status == Status.active && p.Visibility == Visibility.Public &&
                (p.Content!.ToLower().Contains(searchQuery) ||
                 p.User!.FullName.ToLower().Contains(searchQuery)))
            .Include(p => p.User)
            .Include(p => p.PostMedias)
            .Include(p => p.HashTags)
            .Include(p => p.Comments).ThenInclude(c => c.User)
            .Include(p => p.Likes).ThenInclude(l => l.User)
            .Include(p => p.Shares)
            .AsNoTracking();

        var total = await postQuery.CountAsync();
        var posts = await postQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        // Get saved posts for current user if provided
        var savedPostIds = new HashSet<Guid>();
        if (currentUserId.HasValue)
        {
            savedPostIds = (await _context.SavedPosts
                .Where(sp => sp.UserId == currentUserId.Value && posts.Select(p => p.Id).Contains(sp.PostId))
                .Select(sp => sp.PostId)
                .ToListAsync()).ToHashSet();
        }

        var result = new PaginatedResponse<PostResponseDto>
        {
            Data = posts.Select(p => MapToResponseDto(p, currentUserId, savedPostIds.Contains(p.Id))).ToList(),
            Total = total,
            Skip = skip,
            Take = take
        };

        return result;
    }

    public async Task<PaginatedResponse<PostResponseDto>> GetPostsByUserAsync(Guid userId, int skip, int take, Guid? currentUserId = null)
    {
        var query = _context.Posts
            .Where(p => p.UserId == userId && p.Status == Status.active)
            .Include(p => p.User)
            .Include(p => p.PostMedias)
            .Include(p => p.Comments).ThenInclude(c => c.User)
            .Include(p => p.Likes).ThenInclude(l => l.User)
            .Include(p => p.Shares)
            .AsNoTracking();

        var total = await query.CountAsync();
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var savedPostIds = new HashSet<Guid>();
        if (currentUserId.HasValue)
        {
            var postIds = posts.Select(p => p.Id).ToList();
            if (postIds.Any())
            {
                savedPostIds = (await _context.SavedPosts
                    .Where(sp => sp.UserId == currentUserId.Value && postIds.Contains(sp.PostId))
                    .Select(sp => sp.PostId)
                    .ToListAsync()).ToHashSet();
            }
        }

        return new PaginatedResponse<PostResponseDto>
        {
            Data = posts.Select(p => MapToResponseDto(p, currentUserId, savedPostIds.Contains(p.Id))).ToList(),
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    /// <summary>
    /// Get trending posts: posts with images, sorted by like count descending
    /// </summary>
    public async Task<PaginatedResponse<PostResponseDto>> GetTrendingPostsAsync(int skip, int take, Guid? currentUserId = null)
    {
        var query = _context.Posts
            .Where(p => p.Status == Status.active && p.PostMedias.Any())
            .Include(p => p.User)
            .Include(p => p.PostMedias)
            .Include(p => p.HashTags)
            .Include(p => p.Comments).ThenInclude(c => c.User)
            .Include(p => p.Likes).ThenInclude(l => l.User)
            .Include(p => p.Shares)
            .AsNoTracking();

        var total = await query.CountAsync();
        var posts = await query
            .OrderByDescending(p => p.Likes.Count)
            .ThenByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var savedPostIds = new HashSet<Guid>();
        if (currentUserId.HasValue)
        {
            var postIds = posts.Select(p => p.Id).ToList();
            if (postIds.Any())
            {
                savedPostIds = (await _context.SavedPosts
                    .Where(sp => sp.UserId == currentUserId.Value && postIds.Contains(sp.PostId))
                    .Select(sp => sp.PostId)
                    .ToListAsync()).ToHashSet();
            }
        }

        return new PaginatedResponse<PostResponseDto>
        {
            Data = posts.Select(p => MapToResponseDto(p, currentUserId, savedPostIds.Contains(p.Id))).ToList(),
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    public async Task<PostResponseDto> CreatePostAsync(CreatePostDto request)
    {
        var post = new Post
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Content = request.Content,
            Visibility = request.Visibility,
            Status = Status.active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        // Lưu PostMedia nếu có
        if (request.MediaItems != null && request.MediaItems.Any())
        {
            var postMedias = request.MediaItems.Select(m => new PostMedia
            {
                Id = Guid.NewGuid(),
                PostId = post.Id,
                Url = m.Url,
                MediaType = DetectMediaType(m.Url),  // Auto-detect từ URL
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            await _context.PostMedias.AddRangeAsync(postMedias);
            await _context.SaveChangesAsync();
        }

        return MapToResponseDto(post, null, false);
    }

    public async Task<PostResponseDto?> UpdatePostAsync(Guid id, UpdatePostDto request)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if (post == null || post.Status == Status.deleted) return null;

        post.Content = request.Content;
        post.Visibility = request.Visibility;
        post.UpdatedAt = DateTime.UtcNow;

        _postRepository.Update(post);
        await _postRepository.SaveChangesAsync();

        // Cập nhật PostMedia: Xóa cái cũ, thêm cái mới
        if (request.MediaItems != null)
        {
            // Xóa PostMedia cũ
            var existingMedias = await _context.PostMedias
                .Where(pm => pm.PostId == id)
                .ToListAsync();
            _context.PostMedias.RemoveRange(existingMedias);

            // Thêm PostMedia mới
            if (request.MediaItems.Any())
            {
                var newMedias = request.MediaItems.Select(m => new PostMedia
                {
                    Id = Guid.NewGuid(),
                    PostId = id,
                    Url = m.Url,
                    MediaType = DetectMediaType(m.Url),  // Auto-detect từ URL
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }).ToList();

                await _context.PostMedias.AddRangeAsync(newMedias);
            }

            await _context.SaveChangesAsync();
        }

        return MapToResponseDto(post, null, false);
    }

    public async Task<bool> DeletePostAsync(Guid id)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if (post == null || post.Status == Status.deleted) return false;

        post.Status = Status.deleted;
        post.DeletedAt = DateTime.UtcNow;

        _postRepository.Update(post);
        await _postRepository.SaveChangesAsync();

        // Cũng xóa mềm PostMedia liên quan
        var postMedias = await _context.PostMedias
            .Where(pm => pm.PostId == id && pm.DeletedAt == null)
            .ToListAsync();

        foreach (var media in postMedias)
        {
            media.DeletedAt = DateTime.UtcNow;
            _context.PostMedias.Update(media);
        }

        if (postMedias.Any())
        {
            await _context.SaveChangesAsync();
        }

        return true;
    }

    /// <summary>
    /// Map Post entity to PostResponseDto with aggregated interaction data
    /// </summary>
    private PostResponseDto MapToResponseDto(Post post, Guid? currentUserId, bool isSaved = false)
    {
        var topComments = post.Comments?
            .Where(c => c.DeletedAt == null)
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new CommentDetailDto
            {
                Id = c.Id,
                PostId = c.PostId,
                Content = c.Content,
                User = c.User != null ? new UserBasicDto
                {
                    Id = c.User.Id,
                    FullName = c.User.FullName,
                    Email = c.User.Email,
                    AvatarUrl = c.User.AvatarUrl,
                    Bio = c.User.Bio
                } : null,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToList() ?? new List<CommentDetailDto>();

        var topLikes = post.Likes?
            .OrderByDescending(l => l.CreatedAt)
            .Take(10)
            .Select(l => new LikePreviewDto
            {
                Id = l.Id,
                User = l.User != null ? new UserBasicDto
                {
                    Id = l.User.Id,
                    FullName = l.User.FullName,
                    Email = l.User.Email,
                    AvatarUrl = l.User.AvatarUrl,
                    Bio = l.User.Bio
                } : null,
                ReactionType = l.Type.ToString(),
                CreatedAt = l.CreatedAt
            })
            .ToList() ?? new List<LikePreviewDto>();

        var reactionCounts = post.Likes?
            .GroupBy(l => l.Type)
            .ToDictionary(g => g.Key.ToString(), g => g.Count())
            ?? new Dictionary<string, int>();

        var likeSummary = new LikeSummaryDTO
        {
            TotalLikes = post.Likes?.Count ?? 0,
            ReactionCounts = reactionCounts,
            CurrentUserReaction = currentUserId.HasValue
                ? post.Likes?.FirstOrDefault(l => l.UserId == currentUserId)?.Type
                : null,
            TopLikes = topLikes
        };

        return new PostResponseDto
        {
            Id = post.Id,
            UserId = post.UserId,
            Content = post.Content,
            Visibility = post.Visibility.ToString(),
            Status = post.Status.ToString(),
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            MediaItems = post.PostMedias?.Select(m => new PostMediaDto
            {
                Url = m.Url,
                MediaType = m.MediaType
            }).ToList() ?? new List<PostMediaDto>(),
            Author = post.User != null ? new UserBasicDto
            {
                Id = post.User.Id,
                FullName = post.User.FullName,
                Email = post.User.Email,
                AvatarUrl = post.User.AvatarUrl,
                Bio = post.User.Bio
            } : null,
            LikeCount = post.Likes?.Count ?? 0,
            CommentCount = post.Comments?.Count(c => c.DeletedAt == null) ?? 0,
            ShareCount = post.Shares?.Count ?? 0,
            IsSavedByCurrentUser = isSaved,
            LikeSummary = likeSummary,
            TopComments = topComments,
            HashTags = post.HashTags?.Select(h => h.HashTagName ?? "").Where(h => !string.IsNullOrEmpty(h)).ToList() ?? new List<string>()
        };
    }

    /// <summary>
    /// Auto-detect media type từ file extension
    /// </summary>
    private MediaType DetectMediaType(string url)
    {
        if (string.IsNullOrEmpty(url))
            return MediaType.image; // Mặc định

        var extension = Path.GetExtension(url).ToLower();

        // Hình ảnh
        if (extension == ".jpg" || extension == ".jpeg" || extension == ".png" ||
            extension == ".gif" || extension == ".webp" || extension == ".bmp" ||
            extension == ".svg" || extension == ".ico")
        {
            return MediaType.image;
        }

        // Video
        if (extension == ".mp4" || extension == ".avi" || extension == ".mov" ||
            extension == ".mkv" || extension == ".webm" || extension == ".flv" ||
            extension == ".wmv" || extension == ".m4v" || extension == ".3gp")
        {
            return MediaType.video;
        }

        // Story (loại hình riêng biệt)
        if (extension == ".story")
        {
            return MediaType.story;
        }

        // Mặc định là hình ảnh nếu không xác định được
        return MediaType.image;
    }
}