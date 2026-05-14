using Moq;
using Xunit;
using Microsoft.AspNetCore.Identity;
using System.Collections;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore.Query;
using InteractHub.Api.Models;
using InteractHub.Api.Services.Implementation;
using InteractHub.Api.DTOs.User_Handle;

using Microsoft.AspNetCore.SignalR;
using InteractHub.Api.Hubs;

namespace InteractHub.Tests;

public class UserServiceTests
{
    private sealed class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
    {
        private readonly IQueryProvider _inner;

        public TestAsyncQueryProvider(IQueryProvider inner)
        {
            _inner = inner;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            return new TestAsyncEnumerable<TEntity>(expression);
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new TestAsyncEnumerable<TElement>(expression);
        }

        public object? Execute(Expression expression)
        {
            return _inner.Execute(expression);
        }

        public TResult Execute<TResult>(Expression expression)
        {
            return _inner.Execute<TResult>(expression);
        }

        public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
        {
            return Execute<TResult>(expression);
        }
    }

    private sealed class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
    {
        public TestAsyncEnumerable(IEnumerable<T> enumerable)
            : base(enumerable)
        {
        }

        public TestAsyncEnumerable(Expression expression)
            : base(expression)
        {
        }

        public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        {
            return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
        }

        IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
    }

    private sealed class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
    {
        private readonly IEnumerator<T> _inner;

        public TestAsyncEnumerator(IEnumerator<T> inner)
        {
            _inner = inner;
        }

        public T Current => _inner.Current;

        public ValueTask DisposeAsync()
        {
            _inner.Dispose();
            return ValueTask.CompletedTask;
        }

        public ValueTask<bool> MoveNextAsync()
        {
            return ValueTask.FromResult(_inner.MoveNext());
        }
    }
    private static Mock<UserManager<User>> CreateUserManagerMock()
    {
        var store = new Mock<IUserStore<User>>();
        return new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    private static Mock<RoleManager<IdentityRole<Guid>>> CreateRoleManagerMock()
    {
        var store = new Mock<IRoleStore<IdentityRole<Guid>>>();
        return new Mock<RoleManager<IdentityRole<Guid>>>(
            store.Object, null!, null!, null!, null!);
    }

    private static Mock<IHubContext<NotificationHub>> CreateHubContextMock()
    {
        var hubContext = new Mock<IHubContext<NotificationHub>>();
        var clients = new Mock<IHubClients>();
        var clientProxy = new Mock<IClientProxy>();
        
        hubContext.Setup(x => x.Clients).Returns(clients.Object);
        clients.Setup(x => x.All).Returns(clientProxy.Object);
        
        return hubContext;
    }

    [Fact]
    public async Task GetAllUsersAsync_ReturnsMappedDtos()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), Email = "a@example.com", UserName = "a@example.com", FullName = "A" },
            new User { Id = Guid.NewGuid(), Email = "b@example.com", UserName = "b@example.com", FullName = "B" }
        };

        var asyncUsers = new TestAsyncEnumerable<User>(users);
        userManager.SetupGet(x => x.Users).Returns(asyncUsers);
        userManager.Setup(x => x.GetRolesAsync(It.IsAny<User>())).ReturnsAsync(new List<string> { "User" });
        userManager.Setup(x => x.IsLockedOutAsync(It.IsAny<User>())).ReturnsAsync(false);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = (await service.GetAllUsersAsync()).ToList();

        Assert.Equal(2, result.Count);
        Assert.All(result, dto => Assert.Contains("User", dto.Roles));
    }

    [Fact]
    public async Task GetUserByIdAsync_NotFound_ReturnsNull()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        userManager.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.GetUserByIdAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateUserAsync_UserNotFound_ReturnsNull()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        userManager.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.UpdateUserAsync(Guid.NewGuid(), new UpdateUserDTO
        {
            FullName = "Name",
            DateOfBirth = DateTime.UtcNow,
            Gender = Gender.male
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateUserAsync_UpdateFails_ThrowsException()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        var user = new User { Id = Guid.NewGuid(), Email = "a@example.com", UserName = "a@example.com", FullName = "A" };
        userManager.Setup(x => x.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        userManager.Setup(x => x.UpdateAsync(user)).ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Update failed" }));

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        await Assert.ThrowsAsync<Exception>(() => service.UpdateUserAsync(user.Id, new UpdateUserDTO
        {
            FullName = "New",
            DateOfBirth = DateTime.UtcNow,
            Gender = Gender.female
        }));
    }

    [Fact]
    public async Task DeleteUserAsync_UserNotFound_ReturnsFalse()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        userManager.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.DeleteUserAsync(Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task LockUserAsync_UserNotFound_ReturnsFalse()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        userManager.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.LockUserAsync(Guid.NewGuid(), 3);

        Assert.False(result);
    }

    [Fact]
    public async Task LockUserAsync_ValidUser_ReturnsTrue()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();
        var user = new User { Id = Guid.NewGuid(), Email = "a@example.com", UserName = "a@example.com", FullName = "A" };

        userManager.Setup(x => x.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        userManager.Setup(x => x.SetLockoutEndDateAsync(user, It.IsAny<DateTimeOffset?>()))
            .ReturnsAsync(IdentityResult.Success);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.LockUserAsync(user.Id, 2);

        Assert.True(result);
    }

    [Fact]
    public async Task UnLockUserAsync_UserNotFound_ReturnsFalse()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        userManager.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.UnLockUserAsync(Guid.NewGuid());

        Assert.False(result);
    }

    [Fact]
    public async Task UnLockUserAsync_ValidUser_ReturnsTrue()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();
        var user = new User { Id = Guid.NewGuid(), Email = "a@example.com", UserName = "a@example.com", FullName = "A" };

        userManager.Setup(x => x.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        userManager.Setup(x => x.SetLockoutEndDateAsync(user, null)).ReturnsAsync(IdentityResult.Success);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.UnLockUserAsync(user.Id);

        Assert.True(result);
    }

    [Fact]
    public async Task AssignRoleAsync_RoleMissing_ThrowsException()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();
        var user = new User { Id = Guid.NewGuid(), Email = "a@example.com", UserName = "a@example.com", FullName = "A" };

        userManager.Setup(x => x.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        roleManager.Setup(x => x.RoleExistsAsync("Admin")).ReturnsAsync(false);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        await Assert.ThrowsAsync<Exception>(() => service.AssignRoleAsync(user.Id, "Admin"));
    }

    [Fact]
    public async Task AssignRoleAsync_UserNotFound_ReturnsFalse()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();

        userManager.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.AssignRoleAsync(Guid.NewGuid(), "User");

        Assert.False(result);
    }

    [Fact]
    public async Task AssignRoleAsync_UserNotInRole_AddsRole()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();
        var user = new User { Id = Guid.NewGuid(), Email = "a@example.com", UserName = "a@example.com", FullName = "A" };

        userManager.Setup(x => x.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        roleManager.Setup(x => x.RoleExistsAsync("User")).ReturnsAsync(true);
        userManager.Setup(x => x.IsInRoleAsync(user, "User")).ReturnsAsync(false);
        userManager.Setup(x => x.AddToRoleAsync(user, "User")).ReturnsAsync(IdentityResult.Success);

        var hubContext = CreateHubContextMock();
        var service = new UserService(userManager.Object, roleManager.Object, hubContext.Object);

        var result = await service.AssignRoleAsync(user.Id, "User");

        Assert.True(result);
    }

    [Fact]
    public async Task AssignRoleAsync_UserAlreadyInRole_ReturnsTrue()
    {
        var userManager = CreateUserManagerMock();
        var roleManager = CreateRoleManagerMock();
        var user = new User { Id = Guid.NewGuid(), Email = "a@example.com", UserName = "a@example.com", FullName = "A" };

        userManager.Setup(x => x.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        roleManager.Setup(x => x.RoleExistsAsync("User")).ReturnsAsync(true);
        userManager.Setup(x => x.IsInRoleAsync(user, "User")).ReturnsAsync(true);

        var service = new UserService(userManager.Object, roleManager.Object, CreateHubContextMock().Object);

        var result = await service.AssignRoleAsync(user.Id, "User");

        Assert.True(result);
    }
}
