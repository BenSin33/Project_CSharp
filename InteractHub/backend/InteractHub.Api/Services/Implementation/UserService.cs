using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs.User_Handle;
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