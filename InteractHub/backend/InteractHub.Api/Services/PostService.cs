using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using InteractHub.Api.DTOs;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;

namespace InteractHub.Api.Services;

public class PostsService : IPostsService
{
    private readonly IGenericRepository<Post> _postRepo;
    private readonly IGenericRepository<User> _userRepo;
    private readonly string _connectionString;

    public PostsService(
        IGenericRepository<Post> postRepo, 
        IGenericRepository<User> userRepo,
        IConfiguration config)
    {
        _postRepo = postRepo;
        _userRepo = userRepo;
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    // 1. LẤY BẢNG TIN GỒM N MEDIA VÀ SỐ LƯỢNG TƯƠNG TÁC
    public async Task<IEnumerable<PostResponseDTO>> GetNewsFeedAsync()
    {
        using IDbConnection db = new SqlConnection(_connectionString);
        string sql = @"
            SELECT 
                p.Id, p.UserId, u.FullName AS AuthorName, u.AvatarUrl AS AuthorAvatar,
                p.Content, p.CreatedAt, p.UpdatedAt,
                CASE p.Visibility WHEN 0 THEN 'Public' WHEN 1 THEN 'Friends' ELSE 'Private' END AS Visibility,
                (SELECT COUNT(*) FROM Likes l WHERE l.PostId = p.Id) AS LikeCount,
                (SELECT COUNT(*) FROM Comments c WHERE c.PostId = p.Id) AS CommentCount,
                (SELECT COUNT(*) FROM Shares s WHERE s.PostId = p.Id) AS ShareCount,
                m.Id, m.Url, m.MediaType AS Type
            FROM Posts p
            INNER JOIN AspNetUsers u ON p.UserId = u.Id
            LEFT JOIN PostMedias m ON p.Id = m.PostId
            WHERE p.Status = 0
            ORDER BY p.CreatedAt DESC";

        var postDictionary = new Dictionary<Guid, PostResponseDTO>();

        await db.QueryAsync<PostResponseDTO, MediaItemDTO, PostResponseDTO>(
            sql,
            (post, media) =>
            {
                if (!postDictionary.TryGetValue(post.Id, out var currentPost))
                {
                    currentPost = post;
                    postDictionary.Add(currentPost.Id, currentPost);
                }

                if (media != null && !string.IsNullOrEmpty(media.Url))
                {
                    currentPost.MediaItems.Add(media);
                }
                return currentPost;
            },
            splitOn: "Id"
        );

        return postDictionary.Values;
    }

    // 2. LẤY 1 BÀI VIẾT CỤ THỂ (Cũng lấy đầy đủ count và media)
    public async Task<PostResponseDTO?> GetPostByIdAsync(Guid id)
    {
        using IDbConnection db = new SqlConnection(_connectionString);
        string sql = @"
            SELECT 
                p.Id, p.UserId, u.FullName AS AuthorName, u.AvatarUrl AS AuthorAvatar,
                p.Content, p.CreatedAt, p.UpdatedAt,
                CASE p.Visibility WHEN 0 THEN 'Public' WHEN 1 THEN 'Friends' ELSE 'Private' END AS Visibility,
                (SELECT COUNT(*) FROM Likes l WHERE l.PostId = p.Id) AS LikeCount,
                (SELECT COUNT(*) FROM Comments c WHERE c.PostId = p.Id) AS CommentCount,
                (SELECT COUNT(*) FROM Shares s WHERE s.PostId = p.Id) AS ShareCount,
                m.Id, m.Url, m.MediaType AS Type
            FROM Posts p
            INNER JOIN AspNetUsers u ON p.UserId = u.Id
            LEFT JOIN PostMedias m ON p.Id = m.PostId
            WHERE p.Id = @Id AND p.Status = 0";

        var postDictionary = new Dictionary<Guid, PostResponseDTO>();

        await db.QueryAsync<PostResponseDTO, MediaItemDTO, PostResponseDTO>(
            sql,
            (post, media) =>
            {
                if (!postDictionary.TryGetValue(post.Id, out var currentPost))
                {
                    currentPost = post;
                    postDictionary.Add(currentPost.Id, currentPost);
                }
                if (media != null && !string.IsNullOrEmpty(media.Url))
                {
                    currentPost.MediaItems.Add(media);
                }
                return currentPost;
            },
            new { Id = id },
            splitOn: "Id"
        );

        return postDictionary.Values.FirstOrDefault();
    }

    // 3. TẠO BÀI VIẾT MỚI (Lưu n Media vào database)
    public async Task<PostResponseDTO> CreatePostAsync(Guid userId, PostCreateDTO dto)
    {
        var post = new Post
        {
            UserId = userId,
            Content = dto.Content,
            Visibility = dto.Visibility,
            Status = Status.active,
            CreatedAt = DateTime.UtcNow
        };

        if (dto.MediaItems != null && dto.MediaItems.Any())
        {
            foreach (var item in dto.MediaItems)
            {
                post.PostMedias.Add(new PostMedia { Url = item.Url, MediaType = item.Type });
            }
        }

        await _postRepo.AddAsync(post);
        await _postRepo.SaveChangesAsync();

        var user = await _userRepo.GetByIdAsync(userId);
        
        return new PostResponseDTO
        {
            Id = post.Id,
            UserId = post.UserId,
            AuthorName = user?.FullName ?? "Unknown",
            AuthorAvatar = user?.AvatarUrl,
            Content = post.Content,
            Visibility = post.Visibility.ToString(),
            CreatedAt = post.CreatedAt,
            MediaItems = dto.MediaItems ?? new List<MediaItemDTO>(),
            LikeCount = 0, CommentCount = 0, ShareCount = 0
        };
    }

    // 4. SỬA BÀI VIẾT
    public async Task<bool> UpdatePostAsync(Guid postId, Guid userId, PostUpdateDTO dto)
    {
        var post = await _postRepo.GetByIdAsync(postId);
        if (post == null || post.UserId != userId || post.Status != Status.active) return false;

        post.Content = dto.Content;
        post.Visibility = dto.Visibility;
        post.UpdatedAt = DateTime.UtcNow;

        _postRepo.Update(post);
        await _postRepo.SaveChangesAsync();
        return true;
    }

    // 5. XÓA BÀI VIẾT (Xóa mềm - Soft Delete)
    public async Task<bool> DeletePostAsync(Guid postId, Guid userId)
    {
        var post = await _postRepo.GetByIdAsync(postId);
        if (post == null || post.UserId != userId) return false;

        post.Status = Status.deleted;
        post.DeletedAt = DateTime.UtcNow;

        _postRepo.Update(post);
        await _postRepo.SaveChangesAsync();
        return true;
    }
}