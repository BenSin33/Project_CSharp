using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using InteractHub.Api.Services.Interface;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Services.Implementation;

public class FileUploadService : IFileUploadService
{
    private readonly BlobServiceClient _blobServiceClient;

    public FileUploadService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("AzureBlobStorage");
        _blobServiceClient = new BlobServiceClient(connectionString);
    }

    public async Task<string> UploadFileAsync(IFormFile file, string containerName = "interacthub-media")
    {
        if(file == null || file.Length == 0)
            throw new ArgumentException("File is null or empty", nameof(file));
        
        // reach container (folder on Azure Blob Storage), if not exist then create new one
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName); // reference to container
        
        // Ensure container exists and has public access
        var result = await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);
        if (result == null)
        {
            // If container already exists, ensure it is set to public blob access
            await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);
        }

        // create unique file name to avoid conflicts
        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var blobClient = containerClient.GetBlobClient(fileName);

        //upload file to Azure Blob storage
        using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType});

        //return url of uploaded file (stripping SAS token if present in connection string)
        var finalUrl = blobClient.Uri.ToString();
        var queryIndex = finalUrl.IndexOf('?');
        return queryIndex >= 0 ? finalUrl.Substring(0, queryIndex) : finalUrl;
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        if(string.IsNullOrEmpty(fileUrl)) return false;

        try
        {
            var uri = new Uri(fileUrl);
            // URL format: https://account.blob.core.windows.net/container/blobname
            var containerName = uri.Segments[1].Trim('/');
            var blobName = string.Join("", uri.Segments.Skip(2));
            
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);

            return response.Value;
        } 
        catch 
        {
            return false;
        }
    }
}