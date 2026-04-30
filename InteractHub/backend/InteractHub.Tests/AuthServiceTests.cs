using Moq;
using Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using InteractHub.Api.Services;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs;
using InteractHub.Api.Models;

namespace InteractHub.Tests;

public class AuthServiceTests
{
    private readonly Mock<UserManager<User>> _mockUserManager;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly IAuthService _authService;

    public AuthServiceTests()
    {
        var store = new Mock<IUserStore<User>>();
        _mockUserManager = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _mockConfiguration = new Mock<IConfiguration>();
        
        // Setup default JWT configuration
        _mockConfiguration.Setup(x => x["Jwt:Key"]).Returns("this-is-a-very-secret-key-that-is-at-least-32-characters-long");
        _mockConfiguration.Setup(x => x["Jwt:Issuer"]).Returns("InteractHub");
        _mockConfiguration.Setup(x => x["Jwt:Audience"]).Returns("InteractHubClient");
        
        _authService = new AuthService(_mockUserManager.Object, _mockConfiguration.Object);
    }

    #region RegisterAsync Tests

    [Fact]
    public async Task RegisterAsync_WithValidData_RegistersUserSuccessfully()
    {
        // Arrange
        var registerDto = new RegisterDTO(
            "Test User",
            "test@example.com",
            "Test@1234",
            new DateTime(1990, 1, 1),
            Gender.male);

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(registerDto.Email))
            .ReturnsAsync((User?)null);

        _mockUserManager
            .Setup(x => x.CreateAsync(It.IsAny<User>(), registerDto.Password))
            .ReturnsAsync(IdentityResult.Success);

        _mockUserManager
            .Setup(x => x.AddToRoleAsync(It.IsAny<User>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("User registered successfully", result.Message);
        _mockUserManager.Verify(x => x.FindByEmailAsync(registerDto.Email), Times.Once);
        _mockUserManager.Verify(x => x.CreateAsync(It.IsAny<User>(), registerDto.Password), Times.Once);
        _mockUserManager.Verify(x => x.AddToRoleAsync(It.IsAny<User>(), "User"), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ReturnsFalseWithMessage()
    {
        // Arrange
        var existingUser = new User { Email = "test@example.com", UserName = "test@example.com" };
        var registerDto = new RegisterDTO(
            "Test User",
            "test@example.com",
            "Test@1234",
            new DateTime(1990, 1, 1),
            Gender.female);

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(registerDto.Email))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Email already exists", result.Message);
        _mockUserManager.Verify(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_WithUserCreationFailure_ReturnsFalseWithMessage()
    {
        // Arrange
        var registerDto = new RegisterDTO(
            "Test User",
            "test@example.com",
            "Test@1234",
            new DateTime(1990, 1, 1),
            Gender.other);

        var identityError = new IdentityError { Code = "DuplicateUserName", Description = "Username already exists" };

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(registerDto.Email))
            .ReturnsAsync((User?)null);

        _mockUserManager
            .Setup(x => x.CreateAsync(It.IsAny<User>(), registerDto.Password))
            .ReturnsAsync(IdentityResult.Failed(identityError));

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        Assert.False(result.Success);
        Assert.StartsWith("User registration failed:", result.Message);
        Assert.Contains("Username already exists", result.Message);
    }

    [Fact]
    public async Task RegisterAsync_CapturesToCorrectUserData()
    {
        // Arrange
        var registerDto = new RegisterDTO(
            "New User",
            "newuser@example.com",
            "Test@1234",
            new DateTime(1995, 5, 15),
            Gender.male);

        User? capturedUser = null;
        _mockUserManager
            .Setup(x => x.FindByEmailAsync(registerDto.Email))
            .ReturnsAsync((User?)null);

        _mockUserManager
            .Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .Callback<User, string>((user, password) => capturedUser = user)
            .ReturnsAsync(IdentityResult.Success);

        _mockUserManager
            .Setup(x => x.AddToRoleAsync(It.IsAny<User>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await _authService.RegisterAsync(registerDto);

        // Assert
        Assert.NotNull(capturedUser);
        Assert.Equal(registerDto.Email, capturedUser.Email);
        Assert.Equal(registerDto.Email, capturedUser.UserName);
        Assert.Equal(registerDto.FullName, capturedUser.FullName);
        Assert.Equal(registerDto.DateOfBirth, capturedUser.DateOfBirth);
        Assert.Equal(registerDto.Gender, capturedUser.Gender);
    }

    #endregion

    #region LoginAsync Tests

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsSuccessWithToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "test@example.com",
            FullName = "Test User"
        };

        var loginDto = new LoginDTO("test@example.com", "Test@1234");

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(loginDto.Email))
            .ReturnsAsync(user);

        _mockUserManager
            .Setup(x => x.CheckPasswordAsync(user, loginDto.Password))
            .ReturnsAsync(true);

        _mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("Login successful", result.Message);
        Assert.NotNull(result.Token);
        Assert.NotEmpty(result.Token);
        _mockUserManager.Verify(x => x.FindByEmailAsync(loginDto.Email), Times.Once);
        _mockUserManager.Verify(x => x.CheckPasswordAsync(user, loginDto.Password), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidEmail_ReturnsFalse()
    {
        // Arrange
        var loginDto = new LoginDTO("nonexistent@example.com", "Test@1234");

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(loginDto.Email))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Invalid email or password !!!", result.Message);
        Assert.Null(result.Token);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ReturnsFalse()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "test@example.com"
        };

        var loginDto = new LoginDTO("test@example.com", "WrongPassword@123");

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(loginDto.Email))
            .ReturnsAsync(user);

        _mockUserManager
            .Setup(x => x.CheckPasswordAsync(user, loginDto.Password))
            .ReturnsAsync(false);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Invalid email or password !!!", result.Message);
    }

    [Fact]
    public async Task LoginAsync_WithMultipleRoles_IncludesAllRolesInToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@example.com",
            UserName = "admin@example.com"
        };

        var loginDto = new LoginDTO("admin@example.com", "Admin@1234");

        var roles = new List<string> { "User", "Admin", "Moderator" };

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(loginDto.Email))
            .ReturnsAsync(user);

        _mockUserManager
            .Setup(x => x.CheckPasswordAsync(user, loginDto.Password))
            .ReturnsAsync(true);

        _mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(roles);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Token);
        _mockUserManager.Verify(x => x.GetRolesAsync(user), Times.Once);
    }

    #endregion

    #region GenerateJwtTokenAsync Tests

    [Fact]
    public async Task GenerateJwtTokenAsync_GeneratesValidToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "test@example.com"
        };

        _mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var token = await _authService.GenerateJwtTokenAsync(user);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.Contains(".", token); // JWT should have dots separating header, payload, and signature
    }

    [Fact]
    public async Task GenerateJwtTokenAsync_WithNoRoles_GeneratesToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "test@example.com"
        };

        _mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string>());

        // Act
        var token = await _authService.GenerateJwtTokenAsync(user);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public async Task GenerateJwtTokenAsync_WithAdminRole_GeneratesToken()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@example.com",
            UserName = "admin@example.com"
        };

        _mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "Admin" });

        // Act
        var token = await _authService.GenerateJwtTokenAsync(user);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    #endregion

    #region Edge Cases

    [Fact]
    public async Task RegisterAsync_WithDifferentGenders_RegistersSuccessfully()
    {
        // Test male
        var maleDto = new RegisterDTO(
            "Male User",
            "male@example.com",
            "Test@1234",
            new DateTime(1990, 1, 1),
            Gender.male);

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(maleDto.Email))
            .ReturnsAsync((User?)null);

        _mockUserManager
            .Setup(x => x.CreateAsync(It.IsAny<User>(), maleDto.Password))
            .ReturnsAsync(IdentityResult.Success);

        _mockUserManager
            .Setup(x => x.AddToRoleAsync(It.IsAny<User>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _authService.RegisterAsync(maleDto);
        Assert.True(result.Success);
    }

    [Fact]
    public async Task LoginAsync_CaseInsensitiveEmailLookup()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "test@example.com"
        };

        var loginDto = new LoginDTO("TEST@EXAMPLE.COM", "Test@1234");

        _mockUserManager
            .Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(user);

        _mockUserManager
            .Setup(x => x.CheckPasswordAsync(user, loginDto.Password))
            .ReturnsAsync(true);

        _mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "User" });

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        Assert.True(result.Success);
    }

    [Fact]
    public async Task GenerateJwtTokenAsync_TokenContainsUserEmail()
    {
        // Arrange
        var userEmail = "testuser@example.com";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = userEmail,
            UserName = userEmail
        };

        _mockUserManager
            .Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string>());

        // Act
        var token = await _authService.GenerateJwtTokenAsync(user);

        // Assert
        Assert.NotNull(token);
        var parts = token.Split('.');
        Assert.Equal(3, parts.Length);
    }

    #endregion
}
