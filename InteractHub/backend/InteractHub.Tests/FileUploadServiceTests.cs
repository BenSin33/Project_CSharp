using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using InteractHub.Api.Services.Implementation;
using Xunit;

namespace InteractHub.Tests;

public class FileUploadServiceTests
{
    private static FileUploadService CreateService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "ConnectionStrings:AzureBlobStorage", "UseDevelopmentStorage=true" }
            })
            .Build();

        return new FileUploadService(config);
    }

    [Fact]
    public async Task UploadFileAsync_NullFile_ThrowsArgumentException()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() => service.UploadFileAsync(null!));
    }

    [Fact]
    public async Task UploadFileAsync_EmptyFile_ThrowsArgumentException()
    {
        var service = CreateService();
        using var stream = new MemoryStream(Array.Empty<byte>());
        var file = new FormFile(stream, 0, 0, "file", "empty.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };

        await Assert.ThrowsAsync<ArgumentException>(() => service.UploadFileAsync(file));
    }


    [Fact]
    public async Task DeleteFileAsync_NullOrEmpty_ReturnsFalse()
    {
        var service = CreateService();

        var nullResult = await service.DeleteFileAsync(null!);
        var emptyResult = await service.DeleteFileAsync(string.Empty);

        Assert.False(nullResult);
        Assert.False(emptyResult);
    }

    [Fact]
    public async Task DeleteFileAsync_InvalidUrl_ReturnsFalse()
    {
        var service = CreateService();

        var result = await service.DeleteFileAsync("not-a-url");

        Assert.False(result);
    }

}
