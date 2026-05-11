using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs.Notifications;

public class CreateNotificationDTO
{
    [Required(ErrorMessage = "Content is required.")]
    [StringLength(255)]
    public string Content { get; set; } = null!;

    [Required(ErrorMessage = "Type is required.")]
    public NotificationType Type { get; set; }

    [Required(ErrorMessage = "UserId is required.")]
    public Guid UserId { get; set; }

    public Guid? ActorId { get; set; }      // thêm mới
}

public class NotificationResponseDTO
{
    public Guid Id { get; set; }
    public string Content { get; set; } = null!;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; }
    public Guid UserId { get; set; }
    public Guid? ActorId { get; set; }          // thêm mới
    public string? ActorName { get; set; }      // thêm mới
    public string? ActorAvatarUrl { get; set; } // thêm mới
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateNotificationDTO
{
    [StringLength(255)]
    public string? Content { get; set; }

    public NotificationType? Type { get; set; }

    public bool? IsRead { get; set; }
}