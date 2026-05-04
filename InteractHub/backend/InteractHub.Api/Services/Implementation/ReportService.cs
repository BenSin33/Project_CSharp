using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Data;
using InteractHub.Api.DTOs.Admin;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReportResponseDTO> CreateReportAsync(Guid reporterId, Guid postId, CreateReportDTO request)
    {
        var post = await _context.Posts.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == postId);
        if (post == null)
            throw new InvalidOperationException("Post not found");

        var report = new PostReport
        {
            Id = Guid.NewGuid(),
            Reason = request.Reason,
            ReportType = request.ReportType,
            ReportStatus = ReportStatus.Pending,
            UserId = reporterId,
            PostId = postId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.PostReports.Add(report);
        await _context.SaveChangesAsync();

        return MapToResponseDTO(report, post);
    }

    public async Task<ReportsListResponseDTO> GetAllReportsAsync(int skip = 0, int take = 20, ReportStatus? status = null)
    {
        var query = _context.PostReports
            .Include(r => r.User)
            .Include(r => r.Post)
            .ThenInclude(p => p!.User)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(r => r.ReportStatus == status.Value);

        var total = await query.CountAsync();
        
        var pending = await query.CountAsync(r => r.ReportStatus == ReportStatus.Pending);
        var reviewed = await query.CountAsync(r => r.ReportStatus == ReportStatus.Reviewed);
        var resolved = await query.CountAsync(r => r.ReportStatus == ReportStatus.Resolved);

        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        var reportDtos = reports.Select(r => new ReportResponseDTO
        {
            Id = r.Id,
            Reason = r.Reason,
            ReportType = r.ReportType,
            Status = r.ReportStatus,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            ReporterId = r.UserId,
            ReporterName = r.User?.FullName,
            ReporterEmail = r.User?.Email,
            PostId = r.PostId,
            PostContent = r.Post?.Content,
            PostAuthorId = r.Post?.UserId ?? Guid.Empty,
            PostAuthorName = r.Post?.User?.FullName,
            AdminNotes = null
        }).ToList();

        return new ReportsListResponseDTO
        {
            Reports = reportDtos,
            Total = total,
            Pending = pending,
            Reviewed = reviewed,
            Resolved = resolved,
            Skip = skip,
            Take = take
        };
    }

    public async Task<ReportResponseDTO?> GetReportByIdAsync(Guid reportId)
    {
        var report = await _context.PostReports
            .Include(r => r.User)
            .Include(r => r.Post)
            .ThenInclude(p => p!.User)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
            return null;

        return MapToResponseDTO(report, report.Post);
    }

    public async Task<List<ReportResponseDTO>> GetReportsByPostIdAsync(Guid postId)
    {
        var reports = await _context.PostReports
            .Include(r => r.User)
            .Include(r => r.Post)
            .ThenInclude(p => p!.User)
            .Where(r => r.PostId == postId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reports.Select(r => MapToResponseDTO(r, r.Post)).ToList();
    }

    public async Task<List<ReportResponseDTO>> GetReportsByReporterIdAsync(Guid reporterId)
    {
        var reports = await _context.PostReports
            .Include(r => r.User)
            .Include(r => r.Post)
            .ThenInclude(p => p!.User)
            .Where(r => r.UserId == reporterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reports.Select(r => MapToResponseDTO(r, r.Post)).ToList();
    }

    public async Task<bool> UpdateReportStatusAsync(Guid reportId, Guid adminId, UpdateReportStatusDTO request)
    {
        var report = await _context.PostReports.FirstOrDefaultAsync(r => r.Id == reportId);
        if (report == null)
            return false;

        report.ReportStatus = request.Status;
        report.UpdatedAt = DateTime.UtcNow;

        _context.PostReports.Update(report);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteReportAsync(Guid reportId)
    {
        var report = await _context.PostReports.FirstOrDefaultAsync(r => r.Id == reportId);
        if (report == null)
            return false;

        _context.PostReports.Remove(report);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<(int pending, int reviewed, int resolved)> GetReportStatsAsync()
    {
        var pending = await _context.PostReports.CountAsync(r => r.ReportStatus == ReportStatus.Pending);
        var reviewed = await _context.PostReports.CountAsync(r => r.ReportStatus == ReportStatus.Reviewed);
        var resolved = await _context.PostReports.CountAsync(r => r.ReportStatus == ReportStatus.Resolved);

        return (pending, reviewed, resolved);
    }

    public async Task<List<TopReportedPostDTO>> GetTopReportedPostsAsync(int count = 10)
    {
        var topPosts = await _context.PostReports
            .GroupBy(r => r.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(count)
            .ToListAsync();

        var result = new List<TopReportedPostDTO>();

        foreach (var item in topPosts)
        {
            var post = await _context.Posts.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == item.PostId);
            if (post != null)
            {
                result.Add(new TopReportedPostDTO
                {
                    PostId = post.Id,
                    PostContent = post.Content ?? "[Content not available]",
                    AuthorName = post.User?.FullName ?? "Unknown",
                    ReportCount = item.Count,
                    CreatedAt = post.CreatedAt
                });
            }
        }

        return result;
    }

    private ReportResponseDTO MapToResponseDTO(PostReport report, Post? post)
    {
        return new ReportResponseDTO
        {
            Id = report.Id,
            Reason = report.Reason,
            ReportType = report.ReportType,
            Status = report.ReportStatus,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            ReporterId = report.UserId,
            ReporterName = report.User?.FullName,
            ReporterEmail = report.User?.Email,
            PostId = report.PostId,
            PostContent = post?.Content,
            PostAuthorId = post?.UserId ?? Guid.Empty,
            PostAuthorName = post?.User?.FullName,
            AdminNotes = null
        };
    }
}
