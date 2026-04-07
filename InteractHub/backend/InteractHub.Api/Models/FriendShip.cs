namespace InteractHub.Api.Models;

public class FriendShip : BaseEntity
{
    public IsAccepted IsAccepted {get;set;} = IsAccepted.Pending;  // Indicates if the friend request has been accepted
    public Guid ReceiverId {get;set;} // Foreign key to User
    public Guid RequesterId {get;set;} // Foreign key to User
    public virtual User? Receiver {get;set;} // Navigation property to User
    public virtual User? Requester {get;set;} // Navigation property to Friend
}

public enum IsAccepted
{
    Pending, Accepted, Rejected
}   