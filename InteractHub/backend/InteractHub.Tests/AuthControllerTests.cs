using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using InteractHub.Api.Controllers;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs;
using InteractHub.Api.Services;

namespace InteractHub.Tests;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly AuthController _authController;

    public AuthControllerTests()
    {
        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _authServiceMock = new Mock<IAuthService>();

        _authController = new AuthController(_authServiceMock.Object, _userManagerMock.Object);
    }

    [Fact]
    public async Task Register_ExistingEmail_ReturnsBadRequest()
    {
        // ĐÃ FIX: Sử dụng constructor cho Positional Record và dùng Enum Gender
        var dto = new RegisterDTO("Test User", "test@domain.com", "Password123!", DateTime.Now, Gender.male);

        _authServiceMock.Setup(x => x.RegisterAsync(dto))
            .ReturnsAsync(new AuthResponseDTO(false, "Email already exists"));

        var result = await _authController.Register(dto);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<AuthResponseDTO>(badRequestResult.Value);
        Assert.False(response.Success);
        Assert.Equal("Email already exists", response.Message);
    }

    [Fact]
    public async Task Register_ValidData_ReturnsOk()
    {
        // ĐÃ FIX: Sử dụng constructor cho Positional Record
        var dto = new RegisterDTO("Test User", "test@domain.com", "Password123!", DateTime.Now, Gender.male);

        _authServiceMock.Setup(x => x.RegisterAsync(dto))
            .ReturnsAsync(new AuthResponseDTO(true, "User registered successfully"));

        var result = await _authController.Register(dto);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<AuthResponseDTO>(okResult.Value);
        Assert.True(response.Success);
        Assert.Equal("User registered successfully", response.Message);
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        // ĐÃ FIX: Sử dụng constructor cho LoginDTO (Email, Password)
        var dto = new LoginDTO("test@domain.com", "WrongPassword123!");

        _authServiceMock.Setup(x => x.LoginAsync(dto))
            .ReturnsAsync(new AuthResponseDTO(false, "Invalid email or password !!!"));

        var result = await _authController.Login(dto);

        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        var response = Assert.IsType<AuthResponseDTO>(unauthorizedResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOk()
    {
        var dto = new LoginDTO("test@domain.com", "Password123!");

        _authServiceMock.Setup(x => x.LoginAsync(dto))
            .ReturnsAsync(new AuthResponseDTO(true, "Login successful", "test_jwt_token"));

        var result = await _authController.Login(dto);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<AuthResponseDTO>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Token);
        Assert.NotEmpty(response.Token);
    }
}