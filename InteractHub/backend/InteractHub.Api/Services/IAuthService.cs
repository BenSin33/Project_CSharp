using InteractHub.Api.DTOs;
using InteractHub.Api.Models;

namespace InteractHub.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDTO> RegisterAsync(RegisterDTO model);
    Task<AuthResponseDTO> LoginAsync(LoginDTO model);
    Task<string> GenerateJwtTokenAsync(User user);
}