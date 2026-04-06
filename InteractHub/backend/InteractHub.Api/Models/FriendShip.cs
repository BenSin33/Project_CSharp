public class FriendShip : BaseEntity
{
    public string RequesterId {get;set;}
    public virtual User Requester {get;set;}
    public string ReceiverId {get;set;}
    public virtual User Receiver {get;set;}
    public bool isAccepted {get;set;} = false; // default pending
}