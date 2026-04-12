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
        if (!result.Succeeded) return new AuthResponseDTO (false, "User registration failed");

        await _userManager.AddToRoleAsync(User, "User");
        return new AuthResponseDTO (true, "User registered successfully");

    }

    public async Task<AuthResponseDTO> LoginAsync (LoginDTO model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if(user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var token = await GenerateJwtTokenAsync(user);
            return new AuthResponseDTO(true,"Login successful",token);
        }
        return new AuthResponseDTO(false, "Invalid email or password !!!");

    }

    public async Task<string> GenerateJwtTokenAsync(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
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