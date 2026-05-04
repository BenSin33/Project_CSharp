using InteractHub.Api.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using InteractHub.Api.Models;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController : ControllerBase
{
    private readonly IFileUploadService _fileUploadService;

    public MediaController(IFileUploadService fileUploadService)
    {
        _fileUploadService = fileUploadService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        try
        {
            var fileUrl = await _fileUploadService.UploadFileAsync(file, "interacthub-media");
            return Ok(ApiResponse<string>.Ok(fileUrl, "Upload file successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail(
                "An error occurred while uploading the file",
                new List<string> { ex.Message }));
        }
    }

    [HttpDelete("delete")]
    public async Task<IActionResult> Delete(string fileUrl)
    {
        var result = await _fileUploadService.DeleteFileAsync(fileUrl);

        if (result)
        {
            return Ok(ApiResponse<bool>.Ok(true, "File deleted successfully"));
        }

        return BadRequest(ApiResponse<bool>.Fail("Failed to delete file or file not found"));

    }

}   