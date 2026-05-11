using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InteractHub.Api.Models;
using InteractHub.Api.Repositories;
using InteractHub.Api.DTOs.FriendshipDTO;
using InteractHub.Api.Services.Interface;

namespace InteractHub.Api.Services.Implementation
{
    public class FriendshipService : IFriendshipService
    {
        private readonly IGenericRepository<FriendShip> _friendshipRepository;
        private readonly IGenericRepository<User> _userREpository;

        public FriendshipService(IGenericRepository<FriendShip> friendshipRepository, IGenericRepository<User> userRepository)
        {
            _friendshipRepository = friendshipRepository;
            _userREpository = userRepository;
        }

        public async Task<FriendshipResponseDTO> SendFriendRequestAsync( Guid requesterId, Guid receiverId)
        {
            if (requesterId == receiverId) throw new Exception (" Cannot send friend request to yourself");

            var allFriendships = await _friendshipRepository.GetAllAsync();
            // Kiểm tra nếu đã tồn tại một mối quan hệ nào đó giữa hai người dùng ( bất kể là bạn bè, đang chờ, hay đã bị từ chối)
            var existing = allFriendships.FirstOrDefault(f => f.DeletedAt == null &&
                ((f.RequesterId == requesterId && f.ReceiverId == receiverId) ||
                 (f.RequesterId == receiverId && f.ReceiverId == requesterId)));

            if(existing != null) throw new Exception("A friendship or friend request already exists between these users.");

            var newFriendship = new FriendShip
            {
                Id = Guid.NewGuid(),
                RequesterId = requesterId,
                ReceiverId = receiverId,
                IsAccepted = IsAccepted.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _friendshipRepository.AddAsync(newFriendship);
            await _friendshipRepository.SaveChangesAsync();

            return new FriendshipResponseDTO
            {
                Id = newFriendship.Id,
                Status = "Pending",
                CreatedAt = newFriendship.CreatedAt

            };

        }

        public async Task<bool> AcceptFriendRequestAsync(Guid friendshipId, Guid userId)
        {

            var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
            if ( friendship == null || friendship.DeletedAt != null || friendship.ReceiverId != userId) return false;

            friendship.IsAccepted = IsAccepted.Accepted;
            friendship.UpdatedAt = DateTime.UtcNow;

            _friendshipRepository.Update(friendship);
            await _friendshipRepository.SaveChangesAsync();
            return true;

        }

        public async Task<bool> RejectFriendRequestAsync (Guid friendshipId, Guid userId)
        {
            var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
            if (friendship == null || friendship.DeletedAt != null || friendship.ReceiverId != userId) return false;

            friendship.IsAccepted = IsAccepted.Rejected;
            friendship.UpdatedAt = DateTime.UtcNow;

            _friendshipRepository.Update(friendship);
            await _friendshipRepository.SaveChangesAsync();

            return true;

        }

        public async Task<IEnumerable<UserFriendDTO>> GetFriendListAsync(Guid userId)
        {
            var allFriendships = await _friendshipRepository.GetAllAsync();
            var friendsRelations = allFriendships.Where (                           // Lọc ra những mối quan hệ đã được chấp nhận và liên quan đến userId
                f => f.DeletedAt == null && f.IsAccepted == IsAccepted.Accepted && 
                           (f.RequesterId == userId || f.ReceiverId == userId)
            );

            // Lấy danh sách ID của bạn bè
            var friendIds = friendsRelations.Select(
                f => f.RequesterId == userId ? f.ReceiverId : f.RequesterId
            ).ToList();

            var allUsers = await _userREpository.GetAllAsync();
            return allUsers.Where( u => friendIds.Contains(u.Id)).Select(
                u => new UserFriendDTO
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    AvatarUrl = u.AvatarUrl ?? "",
                    Bio = u.Bio ?? ""
                }
            );
        }

        public async Task<IEnumerable<FriendshipResponseDTO>> GetPendingRequestsAsync(Guid userId)
        {
            var allFriendships = await _friendshipRepository.GetAllAsync();
            var allUsers =  await _userREpository.GetAllAsync();

            return allFriendships.Where(
                f => f.ReceiverId == userId && f.IsAccepted == IsAccepted.Pending && f.DeletedAt == null)
                .Select( f => {
                    
                    var req = allUsers.FirstOrDefault( u => u.Id == f.RequesterId);
                    return new FriendshipResponseDTO
                    {
                        Id = f.Id, 
                        Status = "Pending",
                        CreatedAt =  f.CreatedAt,
                        Requester = req == null ? null : new UserFriendDTO
                        {
                            Id = req.Id,
                            FullName = req.FullName,
                            AvatarUrl = req.AvatarUrl ?? "",
                            Bio = req.Bio ?? ""
                        }
                    };
                });
        }

        public async Task<bool> RemoveFriendAsync(Guid friendshipId, Guid userId)
        {
            var friendship = await _friendshipRepository.GetByIdAsync(friendshipId);
            if(friendship == null || (friendship.RequesterId != userId && friendship.ReceiverId != userId)) return false;

            friendship.DeletedAt = DateTime.UtcNow;
            _friendshipRepository.Update(friendship);
            await _friendshipRepository.SaveChangesAsync();
            return true;
        }

        public async Task<string> CheckFriendshipStatusAsync(Guid userId1, Guid userId2)
        {
            var all = await _friendshipRepository.GetAllAsync();
            var friendship = all.FirstOrDefault( x => x.DeletedAt ==null &&                  // nếu tồn tại một mối quan hệ nào đó giữa hai người dùng ( bất kể là bạn bè, đang chờ, hay đã bị từ chối)
                ((x.RequesterId == userId1 && x.ReceiverId == userId2) || (x.RequesterId == userId2 && x.ReceiverId == userId1)));
            
            if (friendship == null) return "Not Friends";

            if( friendship.IsAccepted == IsAccepted.Accepted) return "Accepted";
            return friendship.RequesterId == userId1 ? "Sent" : "Received";
        }

        public async Task<IEnumerable<UserFriendDTO>> GetFriendSuggestionsAsync(Guid userId)
        {
            var allUsers = await _userREpository.GetAllAsync();
            var allFriendships = await _friendshipRepository.GetAllAsync();
            var relatedUserIds = allFriendships
                .Where(f => f.DeletedAt == null && (f.RequesterId == userId || f.ReceiverId == userId))
                .Select(f => f.RequesterId == userId ? f.ReceiverId : f.RequesterId)
                .ToList();
            relatedUserIds.Add(userId);
            return allUsers
                .Where(u => !relatedUserIds.Contains(u.Id))
                .Take(10)
                .Select(u => new UserFriendDTO
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    AvatarUrl = u.AvatarUrl ?? "",
                    Bio = u.Bio ?? ""
                });
        }

    }
}