using Azure.Storage.Blobs;
using InteractHub.Api.Data;
using InteractHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Services.Implementation;

public class MediaCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MediaCleanupService> _logger;
    private readonly string _containerName = "interacthub-media"; // Tên container trong Azure Blob Storage

    public MediaCleanupService(IServiceProvider serviceProvider, ILogger<MediaCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Media Cleanup service is starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOrphanedFilesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while cleaning up media");
            }

            await Task.Delay(TimeSpan.FromHours(8), stoppingToken);
        }
    }

    private async Task CleanupOrphanedFilesAsync()
    {
        // 1. Tạo một Scope mới để lấy được AppDbContext (vì BackgroundService chạy kiểu Singleton)
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Giả sử bạn đã đăng ký BlobServiceClient trong Program.cs
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var blobServiceClient = new BlobServiceClient(configuration.GetConnectionString("AzureBlobStorage"));
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

        // 2. Lấy danh sách TOÀN BỘ URL đang được xài trong Database
        var usedUrls = await dbContext.PostMedias.Select(m => m.Url).ToListAsync();

        // 3. Duyệt qua từng file đang nằm trên Azure
        await foreach (var blobItem in containerClient.GetBlobsAsync())
        {
            // Nối lại thành URL hoàn chỉnh để so sánh
            var blobUrl = $"{containerClient.Uri}/{blobItem.Name}";

            // Lấy thời gian file được tạo
            var createdOn = blobItem.Properties.CreatedOn;

            // ĐIỀU KIỆN XÓA: File KHÔNG có trong DB VÀ đã tồn tại hơn 24 giờ
            if (!usedUrls.Contains(blobUrl) && createdOn < DateTimeOffset.UtcNow.AddHours(-24))
            {
                _logger.LogInformation($"Deleting orphaned file: {blobUrl}");
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                await blobClient.DeleteIfExistsAsync();
            }
        }
    }
}