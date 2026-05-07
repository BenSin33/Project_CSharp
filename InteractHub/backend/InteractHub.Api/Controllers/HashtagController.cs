using Microsoft.AspNetCore.Mvc;
using InteractHub.Api.Data;
using InteractHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class HashTagController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public HashTagController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GET /api/hashtag
    /// Trả về danh sách tất cả hashtags kèm số lượng bài đăng sử dụng hashtag đó
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllHashTags()
    {
        try
        {
            var hashtags = await _context.HashTags
                .Where(h => h.DeletedAt == null)
                .Select(h => new
                {
                    id = h.Id,
                    name = h.HashTagName,
                    postCount = _context.Posts
                        .Where(p => p.Status == Status.active && p.HashTags.Any(ph => ph.Id == h.Id))
                        .Count()
                })
                .OrderByDescending(h => h.postCount)
                .ToListAsync();

            return Ok(new { success = true, data = hashtags, message = "Hashtags retrieved successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Server error: " + ex.Message });
        }
    }
}