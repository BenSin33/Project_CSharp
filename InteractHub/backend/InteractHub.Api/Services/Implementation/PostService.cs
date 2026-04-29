using InteractHub.Api.Models;
using InteractHub.Api.DTOs.Post;
using InteractHub.Api.Repositories;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation;

public class PostService : IPostService
{
    private readonly IGenericRepository<Post> _postRepository;

    public PostService(IGenericRepository<Post> postRepository)
    {
        _postRepository = postRepository;
    }

    public async Task<IEnumerable<PostResponseDto>> GetAllActivePostsAsync()
    {
        var posts = await _postRepository.GetAllAsync();
        return posts.Where(p => p.Status == Status.active).Select(MapToResponseDto); // logic to filter active posts
    }

    public async Task<PostResponseDto?> GetPostByIdAsync(Guid id)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if( post == null || post.Status == Status.deleted) return null;  // logic to handle deleted posts
        return MapToResponseDto(post);
    }

    public async Task<PostResponseDto> CreatePostAsync(CreatePostDto request)
    {
        var post = new Post
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Content = request.Content,
            Visibility = request.Visibility,
            Status = Status.active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();
        return MapToResponseDto(post);
    }

    public async Task<PostResponseDto?> UpdatePostAsync(Guid id, UpdatePostDto request)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if(post == null || post.Status == Status.deleted) return null;

        post.Content = request.Content;
        post.Visibility = request.Visibility;
        post.UpdatedAt = DateTime.UtcNow;

        _postRepository.Update(post);
        await _postRepository.SaveChangesAsync();

        return MapToResponseDto(post);
    }

    public async Task<bool> DeletePostAsync(Guid id)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if(post == null || post.Status == Status.deleted) return false;

        post.Status = Status.deleted;
        post.DeletedAt = DateTime.UtcNow;

        _postRepository.Update(post);
        await _postRepository.SaveChangesAsync();
        return true;
    }

    private PostResponseDto MapToResponseDto(Post post)
    {
        return new PostResponseDto
        {
            Id = post.Id,
            UserId = post.UserId,
            Content = post.Content,
            Visibility = post.Visibility.ToString(),
            Status = post.Status.ToString(),
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,

            MediaItems = post.PostMedias?.Select(m => new PostMediaDto
            {
                Url = m.Url,
                MediaType = m.MediaType
            }).ToList() ?? new List<PostMediaDto>()

        };
    }

}