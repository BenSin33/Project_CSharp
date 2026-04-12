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
        return result.Success ? Ok(result) : BadRequest(result);

    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO model)
    {
        var result = await _authService.LoginAsync(model);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("refresh-token")]
    [Authorize]
    public async Task<IActionResult> RefreshToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if(string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new AuthResponseDTO(false,"Invalid token"));
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if(user == null)
        {
            return Unauthorized(new AuthResponseDTO(false, "User not found !"));
        }

        var newToken = await _authService.GenerateJwtTokenAsync(user);
        return Ok(new AuthResponseDTO(true, "Token refreshed successfully", newToken));

    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new AuthResponseDTO(false, "Invalid token"));
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return NotFound(new AuthResponseDTO(false, "User not found"));
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new { user.Id, user.Email, user.FullName, user.AvatarUrl, roles });
    }

}