using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InteractHub.Api.DTOs;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Interface;


namespace InteractHub.Api.Services;
public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _config;

    public AuthService(UserManager<User> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }

    public async Task<AuthResponseDTO> RegisterAsync(RegisterDTO model)
    {
        var existingUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingUser != null) return new AuthResponseDTO (false, "Email already exists");

        var User = new User
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName,
            DateOfBirth = model.DateOfBirth,
            Gender = model.Gender
        };

        var result = await _userManager.CreateAsync(User, model.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("|", result.Errors.Select( e => e.Description));
            return new AuthResponseDTO(false, $"User registration failed: {errors}");
        }

        await _userManager.AddToRoleAsync(User, "User");
        return new AuthResponseDTO (true, "User registered successfully");

    }

    public async Task<AuthResponseDTO> LoginAsync (LoginDTO model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        if(user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            // Check if user is banned
            if (user.Status == Models.UserStatus.Banned)
            {
                return new AuthResponseDTO(false, "Tài khoản của bạn đã bị khóa vĩnh viễn. Lý do: " + (user.BanReason ?? "Vi phạm chính sách"));
            }

            // Check if user is suspended/locked out
            if (await _userManager.IsLockedOutAsync(user))
            {
                var lockoutEnd = user.LockoutEnd?.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
                return new AuthResponseDTO(false, $"Tài khoản của bạn đang bị tạm khóa đến {lockoutEnd}. Lý do: " + (user.SuspensionReason ?? "Vi phạm chính sách"));
            }

            var token = await GenerateJwtTokenAsync(user);
            return new AuthResponseDTO(true,"Login successful",token);
        }
        return new AuthResponseDTO(false, "Invalid email or password !!!");

    }

    public async Task<AuthResponseDTO> ChangePasswordAsync(Guid userId, ChangePasswordDTO model)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return new AuthResponseDTO(false, "User not found");

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join("|", result.Errors.Select(e => e.Description));
            return new AuthResponseDTO(false, $"Mật khẩu không hợp lệ: {errors}");
        }

        return new AuthResponseDTO(true, "Mật khẩu đã được thay đổi thành công.");
    }

    public async Task<string> GenerateJwtTokenAsync(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role ?? "")));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? ""));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}