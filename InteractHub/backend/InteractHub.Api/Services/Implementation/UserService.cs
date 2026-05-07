using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs.User_Handle;
using InteractHub.Api.DTOs.Common;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class UserService : IUserService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;

    public UserService(UserManager<User> userManager, RoleManager<IdentityRole<Guid>> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task<IEnumerable<UserResponseDTO>> GetAllUsersAsync()
    {
        var users = await _userManager.Users.ToListAsync();
        var userDtos = new List<UserResponseDTO>();

        foreach ( var user in users)
        {
            userDtos.Add(await MapToResponseDtoAsync(user));
        }
        return userDtos;
    }

    public async Task<UserResponseDTO?> GetUserByIdAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return null;

        return await MapToResponseDtoAsync(user);
    }

    /// <summary>
    /// Search users by name, email, or username
    /// </summary>
    public async Task<PaginatedResponse<UserResponseDTO>> SearchUsersAsync(string query, int skip, int take)
    {
        var searchQuery = query.ToLower();

        var users = await _userManager.Users
            .Where(u => !u.LockoutEnabled || u.LockoutEnd == null)  // Exclude locked out users
            .Where(u => 
                u.FullName!.ToLower().Contains(searchQuery) ||
                u.Email!.ToLower().Contains(searchQuery) ||
                u.UserName!.ToLower().Contains(searchQuery))
            .OrderBy(u => u.FullName)
            .ToListAsync();

        var total = users.Count;
        var pagedUsers = users.Skip(skip).Take(take).ToList();

        var userDtos = new List<UserResponseDTO>();
        foreach (var user in pagedUsers)
        {
            userDtos.Add(await MapToResponseDtoAsync(user));
        }

        return new PaginatedResponse<UserResponseDTO>
        {
            Data = userDtos,
            Total = total,
            Skip = skip,
            Take = take
        };
    }

    public async Task<UserResponseDTO?> UpdateUserAsync(Guid id, UpdateUserDTO request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return null;

        user.FullName = request.FullName;
        user.Location = request.Location;
        user.AvatarUrl = request.AvatarUrl;
        user.Bio = request.Bio;
        user.DateOfBirth = request.DateOfBirth;
        user.Gender = request.Gender;

        var result = await _userManager.UpdateAsync(user);
        if(!result.Succeeded) throw new Exception(
            string.Join(",", result.Errors.Select(e => e.Description))); // throw exception if update failed

        return await MapToResponseDtoAsync(user);
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        var result = await _userManager.DeleteAsync(user);
        return result.Succeeded;
    }

    // ban user
    public async Task<bool> LockUserAsync(Guid id , int daysToLock)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        var result = await _userManager.SetLockoutEndDateAsync // SetLockoutEndDateAsync will lock the user until the specified date, effectively banning them for that duration
        (
            user,
            DateTimeOffset.UtcNow.AddDays(daysToLock)
        );
        return result.Succeeded;
    }

    // unban user
    public async Task<bool> UnLockUserAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        var result = await _userManager.SetLockoutEndDateAsync(user, null);
        return result.Succeeded;
    }

    // assign role to user
    public async Task<bool> AssignRoleAsync(Guid id, string roleName)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        if(!await _roleManager.RoleExistsAsync(roleName))
            throw new Exception($"Role '{roleName}' does not exist !");
        
        if(!await _userManager.IsInRoleAsync(user, roleName))
        {
            var result = await _userManager.AddToRoleAsync(user, roleName);  // AddToRoleAsync will add the user to the specified role, effectively granting them the permissions associated with that role
            return result.Succeeded;
        }

        return true; // user already has the role, consider it a success
    }

    // New status management methods
    public async Task<bool> BanUserAsync(Guid id, string reason)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        user.Status = UserStatus.Banned;
        user.BanReason = reason;
        user.BannedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> UnbanUserAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        user.Status = UserStatus.Active;
        user.BanReason = null;
        user.BannedAt = null;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> SuspendUserAsync(Guid id, int daysUntilExpiry, string reason)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        user.Status = UserStatus.Suspended;
        user.SuspendedUntil = DateTime.UtcNow.AddDays(daysUntilExpiry);
        user.SuspensionReason = reason;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> UnsuspendUserAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        user.Status = UserStatus.Active;
        user.SuspendedUntil = null;
        user.SuspensionReason = null;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> PermanentDeleteUserAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return false;

        // Hard delete user and all associated data
        var result = await _userManager.DeleteAsync(user);
        return result.Succeeded;
    }

    public async Task<UserStatusDTO?> GetUserStatusAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if(user == null) return null;

        var isLocked = await _userManager.IsLockedOutAsync(user);

        return new UserStatusDTO
        {
            Id = user.Id,
            Email = user.Email ?? "",
            FullName = user.FullName,
            Status = user.Status.ToString(),
            SuspendedUntil = user.SuspendedUntil,
            SuspensionReason = user.SuspensionReason,
            BanReason = user.BanReason,
            BannedAt = user.BannedAt,
            IsLockedOut = isLocked
        };
    }

    // Helper Function to map User to UserResponseDTO
    private async Task<UserResponseDTO> MapToResponseDtoAsync(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var isLocked = await _userManager.IsLockedOutAsync(user);

        return new UserResponseDTO
        {
            Id = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            Location = user.Location,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio,
            DateOfBirth = user.DateOfBirth,
            Gender = user.Gender.ToString(),
            Roles = roles,
            IsLockedOut = isLocked

        };
    }


}