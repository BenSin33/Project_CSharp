using Microsoft.AspNetCore.Mvc;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.FriendshipDTO;
using InteractHub.Api.Models;

namespace InteractHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Đường dẫn sẽ là: api/Friendships
    public class FriendshipsController : ControllerBase
    {
        private readonly IFriendshipService _friendshipService;

        public FriendshipsController(IFriendshipService friendshipService)
        {
            _friendshipService = friendshipService;
        }

        // POST: api/Friendships/request
        [HttpPost("request")]
        public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestDTO dto)
        {
            try {
                var result = await _friendshipService.SendFriendRequestAsync(dto.RequesterId, dto.ReceiverId);
                return Ok(ApiResponse<FriendshipResponseDTO>.Ok(result, "Friend request sent."));
            } catch (Exception ex) {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }

        // GET: api/Friendships/pending/{userId}
        [HttpGet("pending/{userId}")]
        public async Task<IActionResult> GetPending(Guid userId)
        {
            var requests = await _friendshipService.GetPendingRequestsAsync(userId);
            return Ok(ApiResponse<IEnumerable<FriendshipResponseDTO>>.Ok(
                requests, "Pending requests retrieved successfully."));
        }

        // PUT: api/Friendships/accept/{id}
        [HttpPut("accept/{id}")]
        public async Task<IActionResult> AcceptRequest(Guid id, [FromQuery] Guid userId)
        {
            var success = await _friendshipService.AcceptFriendRequestAsync(id, userId);
            if (!success) return BadRequest(ApiResponse<string>.Fail("Không thể chấp nhận lời mời."));
            return Ok(ApiResponse<bool>.Ok(true, "Đã trở thành bạn bè!"));
        }

        // PUT: api/Friendships/reject/{id}
        [HttpPut("reject/{id}")]
        public async Task<IActionResult> RejectRequest(Guid id, [FromQuery] Guid userId)
        {
            var success = await _friendshipService.RejectFriendRequestAsync(id, userId);
            if (!success) return BadRequest(ApiResponse<string>.Fail("Thao tác thất bại."));
            return Ok(ApiResponse<bool>.Ok(true, "Đã từ chối lời mời."));
        }

        // GET: api/Friendships/list/{userId}
        [HttpGet("list/{userId}")]
        public async Task<IActionResult> GetFriends(Guid userId)
        {
            var friends = await _friendshipService.GetFriendListAsync(userId);
            return Ok(ApiResponse<IEnumerable<UserFriendDTO>>.Ok(
                friends, "Friend list retrieved successfully."));
        }

        // DELETE: api/Friendships/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveFriend(Guid id, [FromQuery] Guid userId)
        {
            var success = await _friendshipService.RemoveFriendAsync(id, userId);
            if (!success) return NotFound(ApiResponse<string>.Fail("Mối quan hệ không tồn tại."));
            return Ok(ApiResponse<bool>.Ok(true, "Đã xóa bạn bè."));
        }

        // GET: api/Friendships/status
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus([FromQuery] Guid user1, [FromQuery] Guid user2)
        {
            var status = await _friendshipService.CheckFriendshipStatusAsync(user1, user2);
            return Ok(ApiResponse<string>.Ok(status, "Friendship status retrieved."));
        }
    }
}