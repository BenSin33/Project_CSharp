using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using InteractHub.Api.Controllers;
using InteractHub.Api.Models;
using InteractHub.Api.DTOs;

namespace InteractHub.Tests;

public class AuthControllerTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<IConfiguration> _configMock;
    private readonly AuthController _authController;

    public AuthControllerTests()
    {
        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _configMock = new Mock<IConfiguration>();
        _configMock.Setup(c => c["Jwt:Key"]).Returns("Chuoi_Bao_Mat_Test_Dai_Hon_16_Kytu_12345");
        _configMock.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        _configMock.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
        // ĐÃ FIX: Xóa dấu cách dư thừa sau dấu hai chấm
        _configMock.Setup(c => c["Jwt:DurationInMinutes"]).Returns("120");

        _authController = new AuthController(_userManagerMock.Object, _configMock.Object);
    }

    [Fact]
    public async Task Register_ExistingEmail_ReturnsBadRequest()
    {
        // ĐÃ FIX: Sử dụng constructor cho Positional Record và dùng Enum Gender
        var dto = new RegisterDTO("Test User", "test@domain.com", "Password123!", DateTime.Now, Gender.male);

        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(new User());

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

        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync((User?)null);
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<User>(), dto.Password)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<User>(), "User")).ReturnsAsync(IdentityResult.Success);

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

        var user = new User { Email = dto.Email, FullName = "Test User" };

        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, dto.Password)).ReturnsAsync(false);

        var result = await _authController.Login(dto);

        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        var response = Assert.IsType<AuthResponseDTO>(unauthorizedResult.Value);
        Assert.False(response.Success);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOk()
    {
        var dto = new LoginDTO("test@domain.com", "Password123!");
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email,
            FullName = "Test User"
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, dto.Password)).ReturnsAsync(true);

        var result = await _authController.Login(dto);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<AuthResponseDTO>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Token);
        Assert.NotEmpty(response.Token);
    }
}