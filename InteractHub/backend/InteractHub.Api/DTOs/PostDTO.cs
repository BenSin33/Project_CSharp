using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs;

public class MediaItemDTO
{
    public string Url { get; set; } = null!;
    public MediaType Type { get; set; } 
}

public record PostCreateDTO(
    [Required(ErrorMessage = "Nội dung bài viết không được để trống")]
    [StringLength(2000)]
    string Content,
    
    [EnumDataType(typeof(Visibility), ErrorMessage = "Quyền riêng tư không hợp lệ")]
    Visibility Visibility,
    
    // Danh sách file đính kèm (có thể null nếu chỉ đăng chữ)
    List<MediaItemDTO>? MediaItems 
);

public record PostUpdateDTO(
    [Required] [StringLength(2000)] string Content,
    [EnumDataType(typeof(Visibility))] Visibility Visibility
);

// DTO trả về cho Frontend
public class PostResponseDTO
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string AuthorName { get; set; } = null!;
    public string? AuthorAvatar { get; set; }
    public string? Content { get; set; }
    public string Visibility { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Danh sách Media (n hình ảnh/video)
    public List<MediaItemDTO> MediaItems { get; set; } = new List<MediaItemDTO>();
    
    // SỐ LƯỢNG TƯƠNG TÁC
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
}