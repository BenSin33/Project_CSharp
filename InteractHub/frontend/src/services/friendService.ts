import api, { unwrap } from "./api"

export interface FriendshipDto {
  id: string
  requesterId: string
  receiverId: string
  status: string
  createdAt: string
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

// ─── Mocks fallback ────────────────────────────────────────────────────────
const MOCK_REQUESTS: FriendRequestDto[] = [
  { id: "1", friendshipId: "f1", name: "Sarah Johnson", username: "sarahj", timeAgo: "4 days ago" },
  { id: "2", friendshipId: "f2", name: "Michael Chen",  username: "mchen",  timeAgo: "5 days ago" },
]
const MOCK_FRIENDS: FriendDto[] = [
  { id: "1", name: "David Williams", username: "dwilliams" },
  { id: "2", name: "Emma Davis",     username: "emmad"    },
]
const MOCK_SUGGESTIONS: SuggestionDto[] = [
  { id: "1", name: "Alex Turner",  username: "aturner", label: "Suggested for you" },
  { id: "2", name: "James Wilson", username: "jwilson", label: "Suggested for you" },
]

// ─── API calls ─────────────────────────────────────────────────────────────

// GET /api/friendships/pending/{userId}
async function getPendingRequests(userId: string): Promise<FriendRequestDto[]> {
  try {
    const resp = await api.get(`/api/friendships/pending/${userId}`)
    return unwrap<FriendRequestDto[]>(resp) ?? []
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) return MOCK_REQUESTS
    throw err
  }
}

// GET /api/friendships/list/{userId}
async function getFriendList(userId: string): Promise<FriendDto[]> {
  try {
    const resp = await api.get(`/api/friendships/list/${userId}`)
    return unwrap<FriendDto[]>(resp) ?? []
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) return MOCK_FRIENDS
    throw err
  }
}

// POST /api/friendships/request — body: { requesterId, receiverId }
async function sendFriendRequest(requesterId: string, receiverId: string): Promise<void> {
  await api.post("/api/friendships/request", { requesterId, receiverId })
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

// Mock only — backend chưa có endpoint suggestions
async function getSuggestions(): Promise<SuggestionDto[]> {
  try {
    const resp = await api.get("/api/friendships/suggestions")
    return unwrap<SuggestionDto[]>(resp) ?? []
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) return MOCK_SUGGESTIONS
    throw err
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