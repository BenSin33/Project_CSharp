using System.Reflection.Metadata;
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
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        // create unique file name to avoid conflicts
        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var blobClient = containerClient.GetBlobClient(fileName);

        //upload file to Azure Blob storage
        using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType});

        //return url of uploaded file
        return blobClient.Uri.ToString();

    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        if(string.IsNullOrEmpty(fileUrl)) return false;

        // try catch block to handle any potential errors during deletion (e.g. invalid URL, network issues, etc.)
        try
        {
            var uri = new Uri(fileUrl);
            var containerName = uri.Segments[1].Trim('/');
            var blobName = string.Join("", uri.Segments.Skip(2));
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);

            return response.Value; // returns true if deleted successfully, false if file not found or deletion failed
        } 
        catch 
        {
            return false; // log exception if needed
        }
    }
}