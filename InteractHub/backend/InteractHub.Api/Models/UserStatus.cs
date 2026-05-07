namespace InteractHub.Api.Models;

public enum UserStatus
{
    Active = 0,      // Hoạt động bình thường
    Suspended = 1,   // Tạm khóa (có hạn)
    Banned = 2       // Cấm vĩnh viễn
}
