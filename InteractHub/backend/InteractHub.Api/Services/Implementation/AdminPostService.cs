using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Data;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class AdminPostService : IAdminPostService
{
    private readonly ApplicationDbContext _context;

    public AdminPostService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminPostDetailDTO?> GetPostDetailAsync(Guid postId)
    {
        var post = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Comments)
            .Include(p => p.Likes)
            .Include(p => p.Shares)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null)
            return null;

        var reportCount = await _context.PostReports.CountAsync(r => r.PostId == postId);
        var reports = await _context.PostReports
            .Where(r => r.PostId == postId)
            .ToListAsync();

        return new AdminPostDetailDTO
        {
            Id = post.Id,
            Content = post.Content,
            Visibility = post.Visibility,
            Status = post.Status,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            AuthorId = post.UserId,
            AuthorName = post.User?.FullName,
            AuthorEmail = post.User?.Email,
            CommentCount = post.Comments.Count,
            LikeCount = post.Likes.Count,
            ShareCount = post.Shares.Count,
            ReportCount = reportCount,
            IsReported = reportCount > 0,
            ReportReasons = reports.Select(r => r.ReportType.ToString()).Distinct().ToList()
        };
    }

    public async Task<bool> DeletePostAsync(Guid postId, Guid adminId, AdminDeletePostDTO request)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
        if (post == null)
            return false;

        // Soft delete - set status to deleted
        post.Status = Status.deleted;
        post.UpdatedAt = DateTime.UtcNow;
        post.DeletedAt = DateTime.UtcNow;

        _context.Posts.Update(post);
        
        // Also delete related comments, likes, shares
        var comments = await _context.Comments.Where(c => c.PostId == postId).ToListAsync();
        _context.Comments.RemoveRange(comments);

        var likes = await _context.Likes.Where(l => l.PostId == postId).ToListAsync();
        _context.Likes.RemoveRange(likes);

        var shares = await _context.Shares.Where(s => s.PostId == postId).ToListAsync();
        _context.Shares.RemoveRange(shares);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> HidePostAsync(Guid postId, Guid adminId, string reason)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
        if (post == null)
            return false;

        post.Status = Status.hidden;
        post.UpdatedAt = DateTime.UtcNow;

        _context.Posts.Update(post);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UnhidePostAsync(Guid postId, Guid adminId)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
        if (post == null)
            return false;

        post.Status = Status.active;
        post.UpdatedAt = DateTime.UtcNow;

        _context.Posts.Update(post);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdatePostVisibilityAsync(Guid postId, Guid adminId, UpdatePostVisibilityDTO request)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
        if (post == null)
            return false;

        post.Visibility = request.NewVisibility;
        post.UpdatedAt = DateTime.UtcNow;

        _context.Posts.Update(post);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdatePostStatusAsync(Guid postId, Guid adminId, UpdatePostStatusDTO request)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
        if (post == null)
            return false;

        post.Status = request.NewStatus;
        if (request.NewStatus == Status.deleted)
            post.DeletedAt = DateTime.UtcNow;

        post.UpdatedAt = DateTime.UtcNow;

        _context.Posts.Update(post);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PaginatedResponse<AdminPostDetailDTO>> GetReportedPostsAsync(int skip = 0, int take = 20)
    {
        var reportedPostIds = await _context.PostReports
            .Select(r => r.PostId)
            .Distinct()
            .ToListAsync();

        var total = reportedPostIds.Count;

        var posts = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Comments)
            .Include(p => p.Likes)
            .Include(p => p.Shares)
            .Where(p => reportedPostIds.Contains(p.Id))
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var dtos = new List<AdminPostDetailDTO>();
        foreach (var post in posts)
        {
            var reportCount = await _context.PostReports.CountAsync(r => r.PostId == post.Id);
            var reports = await _context.PostReports
                .Where(r => r.PostId == post.Id)
                .ToListAsync();

            dtos.Add(new AdminPostDetailDTO
            {
                Id = post.Id,
                Content = post.Content,
                Visibility = post.Visibility,
                Status = post.Status,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.UserId,
                AuthorName = post.User?.FullName,
                AuthorEmail = post.User?.Email,
                CommentCount = post.Comments.Count,
                LikeCount = post.Likes.Count,
                ShareCount = post.Shares.Count,
                ReportCount = reportCount,
                IsReported = true,
                ReportReasons = reports.Select(r => r.ReportType.ToString()).Distinct().ToList()
            });
        }

        return new PaginatedResponse<AdminPostDetailDTO>
        {
            Data = dtos,
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    public async Task<PaginatedResponse<AdminPostDetailDTO>> GetPostsByUserAsync(Guid userId, int skip = 0, int take = 20)
    {
        var query = _context.Posts
            .Include(p => p.User)
            .Include(p => p.Comments)
            .Include(p => p.Likes)
            .Include(p => p.Shares)
            .Where(p => p.UserId == userId);

        var total = await query.CountAsync();

        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var dtos = new List<AdminPostDetailDTO>();
        foreach (var post in posts)
        {
            var reportCount = await _context.PostReports.CountAsync(r => r.PostId == post.Id);
            var reports = await _context.PostReports
                .Where(r => r.PostId == post.Id)
                .ToListAsync();

            dtos.Add(new AdminPostDetailDTO
            {
                Id = post.Id,
                Content = post.Content,
                Visibility = post.Visibility,
                Status = post.Status,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.UserId,
                AuthorName = post.User?.FullName,
                AuthorEmail = post.User?.Email,
                CommentCount = post.Comments.Count,
                LikeCount = post.Likes.Count,
                ShareCount = post.Shares.Count,
                ReportCount = reportCount,
                IsReported = reportCount > 0,
                ReportReasons = reports.Select(r => r.ReportType.ToString()).Distinct().ToList()
            });
        }

        return new PaginatedResponse<AdminPostDetailDTO>
        {
            Data = dtos,
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    public async Task<(int success, int failed)> BulkPostActionAsync(Guid adminId, BulkPostActionDTO request)
    {
        int success = 0, failed = 0;

        foreach (var postId in request.PostIds)
        {
            try
            {
                var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
                if (post == null)
                {
                    failed++;
                    continue;
                }

                switch (request.Action.ToLower())
                {
                    case "delete":
                        post.Status = Status.deleted;
                        post.DeletedAt = DateTime.UtcNow;
                        break;
                    case "hide":
                        post.Status = Status.hidden;
                        break;
                    case "unhide":
                        post.Status = Status.active;
                        break;
                    default:
                        failed++;
                        continue;
                }

                post.UpdatedAt = DateTime.UtcNow;
                _context.Posts.Update(post);
                success++;
            }
            catch
            {
                failed++;
            }
        }

        await _context.SaveChangesAsync();
        return (success, failed);
    }

    public async Task<List<FlaggedContentDTO>> GetFlaggedContentAsync(int count = 50)
    {
        // TODO: Implement flagged content detection
        // This would be populated by automated content moderation system
        return new List<FlaggedContentDTO>();
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid adminId, string reason)
    {
        var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment == null)
            return false;

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PaginatedResponse<AdminPostDetailDTO>> SearchPostsAsync(string query, int skip = 0, int take = 20)
    {
        var searchQuery = query.ToLower();

        var dbQuery = _context.Posts
            .Include(p => p.User)
            .Include(p => p.Comments)
            .Include(p => p.Likes)
            .Include(p => p.Shares)
            .Where(p => p.Content!.ToLower().Contains(searchQuery) ||
                        p.User!.FullName.ToLower().Contains(searchQuery));

        var total = await dbQuery.CountAsync();

        var posts = await dbQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var dtos = new List<AdminPostDetailDTO>();
        foreach (var post in posts)
        {
            var reportCount = await _context.PostReports.CountAsync(r => r.PostId == post.Id);
            dtos.Add(new AdminPostDetailDTO
            {
                Id = post.Id,
                Content = post.Content,
                Visibility = post.Visibility,
                Status = post.Status,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.UserId,
                AuthorName = post.User?.FullName,
                AuthorEmail = post.User?.Email,
                CommentCount = post.Comments.Count,
                LikeCount = post.Likes.Count,
                ShareCount = post.Shares.Count,
                ReportCount = reportCount,
                IsReported = reportCount > 0
            });
        }

        return new PaginatedResponse<AdminPostDetailDTO>
        {
            Data = dtos,
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    public async Task<List<AdminPostDetailDTO>> GetPostsPendingReviewAsync()
    {
        var posts = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Comments)
            .Include(p => p.Likes)
            .Include(p => p.Shares)
            .Where(p => _context.PostReports.Any(r => r.PostId == p.Id && r.ReportStatus == ReportStatus.Pending))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var dtos = new List<AdminPostDetailDTO>();
        foreach (var post in posts)
        {
            var reportCount = await _context.PostReports.CountAsync(r => r.PostId == post.Id);
            var reports = await _context.PostReports
                .Where(r => r.PostId == post.Id)
                .ToListAsync();

            dtos.Add(new AdminPostDetailDTO
            {
                Id = post.Id,
                Content = post.Content,
                Visibility = post.Visibility,
                Status = post.Status,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                AuthorId = post.UserId,
                AuthorName = post.User?.FullName,
                AuthorEmail = post.User?.Email,
                CommentCount = post.Comments.Count,
                LikeCount = post.Likes.Count,
                ShareCount = post.Shares.Count,
                ReportCount = reportCount,
                IsReported = true,
                ReportReasons = reports.Select(r => r.ReportType.ToString()).Distinct().ToList()
            });
        }

        return dtos;
    }
}
