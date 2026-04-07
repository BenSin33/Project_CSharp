using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InteractHub.Api.DTOs;
using InteractHub.Api.Models;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly IConfiguration _config;

    public AuthController(UserManager<User> userManager, RoleManager<IdentityRole<Guid>> roleManager, IConfiguration config)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDTO model)
    {
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser !=null) return BadRequest(new AuthResponseDTO(false,"Email already exists"));
        var user = new User
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName,
            DateOfBirth = model.DateOfBirth,
            Gender = model.Gender
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if(!result.Succeeded) return BadRequest(new AuthResponseDTO(false, "User registration failed"));
        await _userManager.AddToRoleAsync(user, "User");
        return Ok(new AuthResponseDTO(true, "User registered successfully"));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if(user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var token = GenerateJwtToken(user);
            return Ok(new AuthResponseDTO(true, "Login successful", token));

        }
        return Unauthorized(new AuthResponseDTO(false, "Invalid email or password"));
    }

    public string GenerateJwtToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim("Fullname", user.FullName!)
        };

        // Get roles for the user
        var userRoles = _userManager.GetRolesAsync(user).Result;
        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["Jwt:DurationInMinutes"])),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpPost("refresh-token")]
    [Authorize]
    public async Task<IActionResult> RefreshToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new AuthResponseDTO(false, "Invalid token"));
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return Unauthorized(new AuthResponseDTO(false, "User not found"));
        }

        var newToken = GenerateJwtToken(user);
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

    [HttpPost("admin/create-admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateAdminUser([FromBody] RegisterDTO model)
    {
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null)
        {
            return BadRequest(new AuthResponseDTO(false, "Email already exists"));
        }

        var user = new User
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName,
            DateOfBirth = model.DateOfBirth,
            Gender = model.Gender,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponseDTO(false, string.Join(", ", result.Errors.Select(e => e.Description))));
        }

        await _userManager.AddToRoleAsync(user, "Admin");
        return Ok(new AuthResponseDTO(true, "Admin user created successfully"));
    }
}