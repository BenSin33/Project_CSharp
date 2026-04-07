// định dạng dữ liệu cho các tính năng đăng kí và đăng nhập
using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs;

public record RegisterDTO (string FullName, string Email, string Password, DateTime DateOfBirth, Gender Gender);
public record LoginDTO (string Email, string Password);
public record AuthResponseDTO (bool Success, string Message, string? Token = null);
public record TokenRefreshDTO (string Token);