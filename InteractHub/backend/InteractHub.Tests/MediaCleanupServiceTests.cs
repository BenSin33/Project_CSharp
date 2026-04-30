using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using InteractHub.Api.Data;
using InteractHub.Api.Services.Implementation;
using Xunit;

namespace InteractHub.Tests;

public class MediaCleanupServiceTests
{
    private sealed class TestMediaCleanupService : MediaCleanupService
    {
        public TestMediaCleanupService(IServiceProvider serviceProvider, ILogger<MediaCleanupService> logger)
            : base(serviceProvider, logger)
        {
        }

        public Task RunAsync(CancellationToken token)
        {
            return base.ExecuteAsync(token);
        }
    }

    [Fact]
    public async Task ExecuteAsync_CanceledToken_Completes()
    {
        var provider = new ServiceCollection().BuildServiceProvider();
        using var loggerFactory = LoggerFactory.Create(builder => { });
        var logger = loggerFactory.CreateLogger<MediaCleanupService>();
        var service = new TestMediaCleanupService(provider, logger);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await service.RunAsync(cts.Token);

        Assert.True(cts.IsCancellationRequested);
    }
}
