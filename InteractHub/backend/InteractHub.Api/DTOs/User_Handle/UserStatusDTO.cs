namespace InteractHub.Api.DTOs.User_Handle;

public class UserStatusDTO
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime? SuspendedUntil { get; set; }
    public string? SuspensionReason { get; set; }
    public string? BanReason { get; set; }
    public DateTime? BannedAt { get; set; }
    public bool IsLockedOut { get; set; }
}

public class BanUserDTO
{
    public string Reason { get; set; } = null!;
}

public class SuspendUserDTO
{
    public int DaysUntilExpiry { get; set; } = 7;
    public string Reason { get; set; } = null!;
}

public class UnbanUserDTO
{
    public string Reason { get; set; } = "Unbanned by admin";
}
