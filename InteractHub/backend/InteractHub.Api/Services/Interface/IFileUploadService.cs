using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
namespace InteractHub.Api.Services.Interface;

public interface IFileUploadService
{
    // Uploads a file to Azure Blob Storage and returns the URL of the uploaded file.
    Task<string> UploadFileAsync(IFormFile file, string containerName = "InteractHub");

    // Deletes a file from Azure Blob Storage given its URL.
    Task<bool> DeleteFileAsync(string fileUrl);


}