using Microsoft.AspNetCore.Mvc;
using InteractHub.Api.Services.Interface;
using InteractHub.Api.DTOs.FriendshipDTO;
using System.Security.Claims;

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
                return Ok(result);
            } catch (Exception ex) {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/Friendships/pending/{userId}
        [HttpGet("pending/{userId}")]
        public async Task<IActionResult> GetPending(Guid userId)
        {
            var requests = await _friendshipService.GetPendingRequestsAsync(userId);
            return Ok(requests);
        }

        // PUT: api/Friendships/accept/{id}
        [HttpPut("accept/{id}")]
        public async Task<IActionResult> AcceptRequest(Guid id, [FromQuery] Guid userId)
        {
            var success = await _friendshipService.AcceptFriendRequestAsync(id, userId);
            if (!success) return BadRequest("Không thể chấp nhận lời mời.");
            return Ok(new { message = "Đã trở thành bạn bè!" });
        }

        // PUT: api/Friendships/reject/{id}
        [HttpPut("reject/{id}")]
        public async Task<IActionResult> RejectRequest(Guid id, [FromQuery] Guid userId)
        {
            var success = await _friendshipService.RejectFriendRequestAsync(id, userId);
            if (!success) return BadRequest("Thao tác thất bại.");
            return Ok(new { message = "Đã từ chối lời mời." });
        }

        // GET: api/Friendships/list/{userId}
        [HttpGet("list/{userId}")]
        public async Task<IActionResult> GetFriends(Guid userId)
        {
            var friends = await _friendshipService.GetFriendListAsync(userId);
            return Ok(friends);
        }

        // DELETE: api/Friendships/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveFriend(Guid id, [FromQuery] Guid userId)
        {
            var success = await _friendshipService.RemoveFriendAsync(id, userId);
            if (!success) return NotFound("Mối quan hệ không tồn tại.");
            return Ok(new { message = "Đã xóa bạn bè." });
        }

        // GET: api/Friendships/status
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus([FromQuery] Guid user1, [FromQuery] Guid user2)
        {
            var status = await _friendshipService.CheckFriendshipStatusAsync(user1, user2);
            return Ok(new { status });
        }
    }
}