namespace InteractHub.Api.DTOs.Post;

public class PostResponseDto
{
    public Guid Id {get;set;}
    public Guid UserId {get;set;}
    public string? Content {get;set;}
    public string? Visibility {get;set;}
    public string? Status {get;set;} // Active, Deleted, etc.
    public DateTime CreatedAt {get;set;}
    public DateTime UpdatedAt {get;set;}
}