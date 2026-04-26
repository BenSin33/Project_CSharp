using System;
using InteractHub.Api.Models;
namespace InteractHub.Api.DTOs.FriendshipDTO
{
    public class SendFriendRequestDTO
    {
        public Guid RequesterId {get;set;}
        public Guid ReceiverId {get;set;}
    }

    public class UserFriendDTO
    {
        public Guid Id {get;set;}
        public string? FullName {get;set;}
        public string? AvatarUrl {get;set;}
        public string? Bio {get;set;}
    }
    
    public class FriendshipResponseDTO
    {
        public Guid Id {get;set;}
        public UserFriendDTO Requester {get;set;}
        public UserFriendDTO Receiver {get;set;}
        public string Status {get;set;} = string.Empty;
        public DateTime CreatedAt {get;set;}
    }
}