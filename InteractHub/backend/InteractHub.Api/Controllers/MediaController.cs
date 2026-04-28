using InteractHub.Api.Services.Interface;
using Microsoft.AspNetCore.Mvc;

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
            return Ok (
                new
                {
                    success = true, 
                    message = "Upload file successfully",
                    url = fileUrl
                }
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest ( new { success = false, message = ex.Message});
        }
        catch (Exception ex)
        {
            return StatusCode (500, new {success = false, message = "An error occurred while uploading the file", error = ex.Message});
        }
    }

    [HttpDelete("delete")]
    public async Task<IActionResult> Delete(string fileUrl)
    {
        var result = await _fileUploadService.DeleteFileAsync(fileUrl);

        if (result)
        {
            return Ok (new {success = true, message = "File deleted successfully"});
        }

        return BadRequest (new {success = false, message ="Failed to delete file or file not found"});

    }

}   