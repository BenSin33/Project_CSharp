using InteractHub.Api.DTOs.User_Handle;
using InteractHub.Api.DTOs.Common;

namespace InteractHub.Api.Services.Interface;

public interface IUserService
{
    Task<IEnumerable<UserResponseDTO>> GetAllUsersAsync();
    Task<UserResponseDTO?> GetUserByIdAsync(Guid id);
    Task<UserResponseDTO?> UpdateUserAsync(Guid id, UpdateUserDTO request);
    Task<bool> DeleteUserAsync(Guid id);
    Task<bool> LockUserAsync(Guid id, int daysToLock);
    Task<bool> UnLockUserAsync(Guid id);
    Task<bool> AssignRoleAsync(Guid id, string roleName);
    Task<PaginatedResponse<UserResponseDTO>> SearchUsersAsync(string query, int skip, int take);
    
    // New status management methods
    Task<bool> BanUserAsync(Guid id, string reason);
    Task<bool> UnbanUserAsync(Guid id);
    Task<bool> SuspendUserAsync(Guid id, int daysUntilExpiry, string reason);
    Task<bool> UnsuspendUserAsync(Guid id);
    Task<bool> PermanentDeleteUserAsync(Guid id);
    Task<UserStatusDTO?> GetUserStatusAsync(Guid id);
}