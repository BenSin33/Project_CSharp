using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using InteractHub.Api.Data;
using InteractHub.Api.Hubs;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Tests;

public abstract class TestBase
{
    protected ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    protected Mock<IHubContext<NotificationHub>> CreateHubContextMock()
    {
        var hubContext = new Mock<IHubContext<NotificationHub>>();
        var clients = new Mock<IHubClients>();
        var clientProxy = new Mock<ISingleClientProxy>(); // Use ISingleClientProxy for SendAsync
        
        hubContext.Setup(x => x.Clients).Returns(clients.Object);
        clients.Setup(x => x.All).Returns(clientProxy.Object);
        clients.Setup(x => x.User(It.IsAny<string>())).Returns(clientProxy.Object);
        
        return hubContext;
    }

    protected Mock<INotificationService> CreateNotificationServiceMock()
    {
        return new Mock<INotificationService>();
    }
}
