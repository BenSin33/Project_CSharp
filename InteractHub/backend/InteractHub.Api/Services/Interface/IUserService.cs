using InteractHub.Api.DTOs.User_Handle;

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
}