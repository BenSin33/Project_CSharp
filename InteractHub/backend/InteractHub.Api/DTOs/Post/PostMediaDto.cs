using InteractHub.Api.Models;

namespace InteractHub.Api.DTOs.Post;

public class PostMediaDto
{
    public string Url {get;set;} = null!;

    public MediaType MediaType {get;set;}
}