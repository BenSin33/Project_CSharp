namespace InteractHub.Api.DTOs.Common;

/// <summary>
/// Lightweight user info for embedding in other DTOs (comments, likes, posts)
/// </summary>
public class UserBasicDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
}
