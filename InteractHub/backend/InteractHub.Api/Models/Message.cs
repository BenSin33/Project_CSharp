public class Message : BaseEntity
{
    public string MessageContent {get;set;}
    public bool IsRead {get;set;}
    public string SenderId {get;set;}
    public virtual User Sender {get;set;}
    public string ReceiverId {get;set;}
    public virtual User Receiver {get;set;}
}