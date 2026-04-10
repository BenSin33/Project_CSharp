using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Models;

public class HashTag : BaseEntity
{
    [Required]
    [StringLength(50)]
    public string? HashTagName {get;set;}
}