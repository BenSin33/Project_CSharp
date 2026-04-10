
using System.ComponentModel.DataAnnotations;
namespace InteractHub.Api.Models;

public class Message : BaseEntity
{
    [Required(ErrorMessage = "Message content is required.")]
    public string? MessageContent {get;set;}
    public DateTime SentAt {get;set;} = DateTime.UtcNow;
    public bool IsRead {get;set;} = false;
    public Guid SenderId {get;set;} // Foreign key to User
    public Guid ReceiverId {get;set;} // Foreign key to User
    public virtual User? Sender {get;set;} // Navigation property to User
    public virtual User? Receiver {get;set;} // Navigation property to User
}