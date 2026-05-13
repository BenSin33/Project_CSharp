using InteractHub.Api.DTOs;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services.Interface;

public interface IAuthService
{
    Task<AuthResponseDTO> RegisterAsync(RegisterDTO model);
    Task<AuthResponseDTO> LoginAsync(LoginDTO model);
    Task<AuthResponseDTO> ChangePasswordAsync(Guid userId, ChangePasswordDTO model);
    Task<string> GenerateJwtTokenAsync(User user);
}