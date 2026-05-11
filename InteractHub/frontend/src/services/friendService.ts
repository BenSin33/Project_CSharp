import api, { unwrap } from "./api"

/** Tương ứng FriendshipResponseDTO backend */
export interface FriendshipResponseDTO {
  id: string
  requester: { id: string; fullName?: string; avatarUrl?: string; bio?: string }
  receiver:  { id: string; fullName?: string; avatarUrl?: string; bio?: string }
  status: string
  createdAt: string
}

export interface UserFriendDTO {
  id: string
  fullName?: string
  avatarUrl?: string
  bio?: string
}

export interface FriendDto {
  id: string
  name: string
  username: string
  avatarUrl?: string
}

export interface FriendRequestDto extends FriendDto {
  friendshipId: string
  timeAgo: string
}

export interface SuggestionDto extends FriendDto {
  label: string
}

// ─── Mapping helpers ────────────────────────────────────────────────────────────

function mapFriendshipToRequest(f: FriendshipResponseDTO, currentUserId: string): FriendRequestDto {
  // Người gửi request là requester
  const other = f.requester.id !== currentUserId ? f.requester : f.receiver
  return {
    id: String(other.id),
    friendshipId: String(f.id),
    name: other.fullName ?? "",
    username: "",
    avatarUrl: other.avatarUrl,
    timeAgo: f.createdAt ? new Date(f.createdAt).toLocaleDateString("vi-VN") : "",
  }
}

function mapUserFriendToFriend(u: UserFriendDTO): FriendDto {
  return {
    id: String(u.id),
    name: u.fullName ?? "",
    username: (u.fullName ?? "").toLowerCase().replace(/\s/g, ""),
    avatarUrl: u.avatarUrl,
  }
}

// GET /api/friendships/pending/{userId}
async function getPendingRequests(userId: string): Promise<FriendRequestDto[]> {
  try {
    const resp = await api.get(`/api/friendships/pending/${userId}`)
    const raw = unwrap<FriendshipResponseDTO[]>(resp) ?? []
    return raw.map((f) => mapFriendshipToRequest(f, userId))
  } catch (err: any) {
    console.error("getPendingRequests error:", err)
    throw err
  }
}

// GET /api/friendships/list/{userId}
async function getFriendList(userId: string): Promise<FriendDto[]> {
  try {
    const resp = await api.get(`/api/friendships/list/${userId}`)
    const raw = unwrap<UserFriendDTO[]>(resp) ?? []
    return raw.map(mapUserFriendToFriend)
  } catch (err: any) {
    console.error("getFriendList error:", err)
    throw err
  }
}

// POST /api/friendships/request — body: { requesterId, receiverId }
async function sendFriendRequest(requesterId: string, receiverId: string): Promise<void> {
  await api.post("/api/friendships/request", { RequesterId: requesterId, ReceiverId: receiverId })
}

// PUT /api/friendships/accept/{id}?userId={userId}
async function acceptRequest(friendshipId: string, userId: string): Promise<void> {
  await api.put(`/api/friendships/accept/${friendshipId}`, null, {
    params: { userId },
  })
}

// PUT /api/friendships/reject/{id}?userId={userId}
async function rejectRequest(friendshipId: string, userId: string): Promise<void> {
  await api.put(`/api/friendships/reject/${friendshipId}`, null, {
    params: { userId },
  })
}

// DELETE /api/friendships/{id}?userId={userId}
async function removeFriend(friendshipId: string, userId: string): Promise<void> {
  await api.delete(`/api/friendships/${friendshipId}`, {
    params: { userId },
  })
}

// GET /api/friendships/status?user1={}&user2={}
async function checkFriendshipStatus(user1: string, user2: string): Promise<string> {
  const resp = await api.get("/api/friendships/status", {
    params: { user1, user2 },
  })
  const data = unwrap<{ status: string }>(resp)
  return data?.status ?? "none"
}

// GET /api/friendships/suggestions/{userId}
async function getSuggestions(userId?: string): Promise<SuggestionDto[]> {
  if (!userId) return []
  try {
    const resp = await api.get(`/api/friendships/suggestions/${userId}`)
    const raw = unwrap<UserFriendDTO[]>(resp) ?? []
    return raw.map((u) => ({
      ...mapUserFriendToFriend(u),
      label: "Suggested for you",
    }))
  } catch (err) {
    console.error("getSuggestions error:", err)
    return []
  }
}

export const friendService = {
  getPendingRequests,
  getFriendList,
  sendFriendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  checkFriendshipStatus,
  getSuggestions,
}
