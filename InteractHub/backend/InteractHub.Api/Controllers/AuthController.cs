using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using InteractHub.Api.DTOs;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.Models;
using Microsoft.Extensions.Validation;
using System.Security;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<User> _userManager;

    public AuthController (IAuthService authService, UserManager<User> userManager)
    {
        _authService = authService;
        _userManager = userManager;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDTO model)
    {
        var result = await _authService.RegisterAsync(model);
        return result.Success
            ? Ok(ApiResponse<AuthResponseDTO>.Ok(result, result.Message ?? "Registered successfully"))
            : BadRequest(ApiResponse<AuthResponseDTO>.Fail(result.Message ?? "Registration failed"));

    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO model)
    {
        var result = await _authService.LoginAsync(model);
        return result.Success
            ? Ok(ApiResponse<AuthResponseDTO>.Ok(result, result.Message ?? "Login successful"))
            : Unauthorized(ApiResponse<AuthResponseDTO>.Fail(result.Message ?? "Login failed"));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordDTO model)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<string>.Fail("Invalid token"));
        }

        var result = await _authService.ChangePasswordAsync(userId, model);
        return result.Success
            ? Ok(ApiResponse<bool>.Ok(true, result.Message))
            : BadRequest(ApiResponse<bool>.Fail(result.Message));
    }

    [HttpPost("refresh-token")]
    [Authorize]
    public async Task<IActionResult> RefreshToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if(string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<AuthResponseDTO>.Fail("Invalid token"));
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if(user == null)
        {
            return Unauthorized(ApiResponse<AuthResponseDTO>.Fail("User not found !"));
        }

        var newToken = await _authService.GenerateJwtTokenAsync(user);
        return Ok(ApiResponse<AuthResponseDTO>.Ok(
            new AuthResponseDTO(true, "Token refreshed successfully", newToken),
            "Token refreshed successfully"));

    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<string>.Fail("Invalid token"));
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return NotFound(ApiResponse<string>.Fail("User not found"));
        }

        var roles = await _userManager.GetRolesAsync(user);
        var profile = new { user.Id, user.Email, user.FullName, user.AvatarUrl, user.Bio, user.Location, user.CreatedAt, roles };
        return Ok(ApiResponse<object>.Ok(profile, "Profile retrieved successfully"));
    }

}