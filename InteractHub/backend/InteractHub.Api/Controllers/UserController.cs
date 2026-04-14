using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.User_Handle;
using InteractHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Client;

namespace InteractHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(ApiResponse<IEnumerable<UserResponseDTO>>.Ok(users));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if(user == null)
            return NotFound(ApiResponse<UserResponseDTO>.Fail("User not found"));

        return Ok(ApiResponse<UserResponseDTO>.Ok(user));
        
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser (Guid id, [FromBody] UpdateUserDTO request)
    {
        //  validate the incoming request
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<string>.Fail("Validation failed", errors));
        }

        // try catch block to handle user update errors
        try
        {
            var updateUser = await _userService.UpdateUserAsync(id, request);
            if(updateUser == null)
                return NotFound(ApiResponse<UserResponseDTO>.Fail("User not found !"));
            
            return Ok(ApiResponse<UserResponseDTO>.Ok(updateUser, "User updated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> LockUser(Guid id, [FromBody] int days = 7)
    {
        var result = await _userService.LockUserAsync(id, days);
        if(!result) return NotFound(ApiResponse<bool>.Fail("User not found or operation failed."));

        return Ok(ApiResponse<bool>.Ok(true, $"User locked for {days} days"));
    }

    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> UnLockUser (Guid id)
    {
        var result = await _userService.UnLockUserAsync(id);
        if(!result) return NotFound(ApiResponse<bool>.Fail("User not found or operation failed."));

        return Ok(ApiResponse<bool>.Ok(true,"User unlocked successfully"));

    }

    [HttpPost("{id}/roles")]
    public async Task<IActionResult> AssignRoles (Guid id, [FromBody] AssignRoleDTO request)
    {
        
        if(!ModelState.IsValid) return BadRequest(ApiResponse<string>.Fail("Invalid role data"));

        try
        {
            var result = await _userService.AssignRoleAsync(id, request.RoleName);
            if(!result) 
                return NotFound(ApiResponse<bool>.Fail("User not found"));

            return Ok(ApiResponse<bool>.Ok(true, $"Role '{request.RoleName}' assigned successfully. "));

        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }

    }
    
}