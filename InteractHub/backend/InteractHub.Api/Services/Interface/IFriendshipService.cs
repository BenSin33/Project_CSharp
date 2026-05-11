using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InteractHub.Api.DTOs.FriendshipDTO;

namespace InteractHub.Api.Services.Interface
{
    public interface IFriendshipService
    {
        Task<FriendshipResponseDTO> SendFriendRequestAsync(Guid requesterId, Guid receiverId);
        Task<bool> AcceptFriendRequestAsync(Guid friendshipId, Guid userId);
        Task<bool> RejectFriendRequestAsync(Guid friendshipId, Guid userId);
        Task<IEnumerable<FriendshipResponseDTO>> GetPendingRequestsAsync(Guid userId);
        Task<IEnumerable<UserFriendDTO>> GetFriendListAsync(Guid userId);
        Task<bool> RemoveFriendAsync(Guid friendshipId, Guid userId);
        Task<string> CheckFriendshipStatusAsync(Guid userId1, Guid userId2);
        Task<IEnumerable<UserFriendDTO>> GetFriendSuggestionsAsync(Guid userId);

    }
}