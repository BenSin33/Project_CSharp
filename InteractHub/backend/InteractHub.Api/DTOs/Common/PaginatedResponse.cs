namespace InteractHub.Api.DTOs.Common;

/// <summary>
/// Generic paginated response for list endpoints
/// </summary>
public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = new List<T>();
    public int Total { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
    public int TotalPages => (Total + Take - 1) / Take;
    public bool HasNextPage => (Skip + Take) < Total;
}
