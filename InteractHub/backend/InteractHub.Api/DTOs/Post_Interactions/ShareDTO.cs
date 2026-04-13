using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.DTOs.Post_Interactions;
public class CreateShareDTO
{
    [Required]
    public Guid PostId {get;set;}
}