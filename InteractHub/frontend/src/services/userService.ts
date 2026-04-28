import api, { unwrap } from "./api"

export interface UserProfileDto {
  id: string
  name: string
  username: string
  email: string
  avatarUrl?: string
  bio?: string
  location?: string
  website?: string
  joinedAt: string
  followingCount: number
  followersCount: number
  postsCount: number
  isOwner?: boolean
  isFollowing?: boolean
}

export interface UpdateProfileDto {
  name?: string
  username?: string
  bio?: string
  location?: string
  website?: string
}

const MOCK_PROFILE: UserProfileDto = {
  id: "demo-1",
  name: "Alex Kim",
  username: "alexkim",
  email: "demo@user.com",
  bio: "Living life one post at a time ✨",
  location: "San Francisco, CA",
  website: "alexkim.dev",
  joinedAt: "March 2024",
  followingCount: 180,
  followersCount: 245,
  postsCount: 42,
  isOwner: true,
}

async function getProfile(userId: string): Promise<UserProfileDto> {
  try {
    const resp = await api.get(`/api/user/${userId}`)
    return unwrap<UserProfileDto>(resp)!
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) {
      return MOCK_PROFILE
    }
    throw err
  }
}

async function getMyProfile(): Promise<UserProfileDto> {
  try {
    const resp = await api.get("/api/user/me")
    return unwrap<UserProfileDto>(resp)!
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) {
      return MOCK_PROFILE
    }
    throw err
  }
}

async function updateProfile(payload: UpdateProfileDto): Promise<UserProfileDto> {
  const resp = await api.put("/api/user/me", payload)
  return unwrap<UserProfileDto>(resp)!
}

async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData()
  form.append("avatar", file)
  const resp = await api.post("/api/user/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return unwrap<{ avatarUrl: string }>(resp)!
}

export const userService = { getProfile, getMyProfile, updateProfile, uploadAvatar }