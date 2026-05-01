import api, { unwrap } from "./api"

/** Tương ứng UserResponseDTO backend */
export interface UserResponseDTO {
  id: string
  email: string
  fullName: string
  location?: string
  avatarUrl?: string
  bio?: string
  dateOfBirth?: string
  gender?: string
  roles?: string[]
  isLockedOut?: boolean
}

/** Profile dùng trong UI */
export interface UserProfileDto {
  id: string
  name: string
  username: string
  email: string
  avatarUrl?: string
  bio?: string
  location?: string
  joinedAt: string
  followingCount: number
  followersCount: number
  postsCount: number
  isOwner?: boolean
}

function mapFromBackend(d: UserResponseDTO): UserProfileDto {
  return {
    id: String(d.id),
    name: d.fullName,
    username: d.email.split("@")[0],
    email: d.email,
    avatarUrl: d.avatarUrl,
    bio: d.bio,
    location: d.location,
    joinedAt: "",
    followingCount: 0,
    followersCount: 0,
    postsCount: 0,
  }
}

const MOCK_PROFILE: UserProfileDto = {
  id: "demo-1",
  name: "Alex Kim",
  username: "alexkim",
  email: "demo@user.com",
  bio: "Living life one post at a time ✨",
  location: "Ho Chi Minh City",
  joinedAt: "2024",
  followingCount: 180,
  followersCount: 245,
  postsCount: 42,
  isOwner: true,
}

/** GET /api/user/{id} — Admin only theo backend; dùng /api/auth/profile cho user thường */
async function getProfile(userId: string): Promise<UserProfileDto> {
  try {
    const resp = await api.get(`/api/user/${userId}`)
    const raw = unwrap<UserResponseDTO>(resp)
    return raw ? mapFromBackend(raw) : MOCK_PROFILE
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500 || err?.response?.status === 403) {
      return MOCK_PROFILE
    }
    throw err
  }
}

/**
 * Lấy profile của user đang đăng nhập.
 * Backend: GET /api/auth/profile (trả {id, email, fullName, avatarUrl, roles})
 */
async function getMyProfile(): Promise<UserProfileDto> {
  try {
    const resp = await api.get("/api/auth/profile")
    const d = resp.data
    return {
      id: String(d?.id ?? ""),
      name: d?.fullName ?? d?.FullName ?? "",
      username: (d?.email ?? "").split("@")[0],
      email: d?.email ?? "",
      avatarUrl: d?.avatarUrl ?? d?.AvatarUrl,
      bio: undefined,
      location: undefined,
      joinedAt: "",
      followingCount: 0,
      followersCount: 0,
      postsCount: 0,
      isOwner: true,
    }
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) {
      return { ...MOCK_PROFILE, isOwner: true }
    }
    throw err
  }
}

/** UpdateUserDTO backend: FullName, Location, AvatarUrl, Bio, DateOfBirth, Gender */
export interface UpdateProfileDto {
  fullName?: string
  location?: string
  bio?: string
  avatarUrl?: string
}

async function updateProfile(userId: string, payload: UpdateProfileDto): Promise<UserProfileDto> {
  const resp = await api.put(`/api/user/${userId}`, {
    FullName: payload.fullName ?? "",
    Location: payload.location,
    AvatarUrl: payload.avatarUrl,
    Bio: payload.bio,
    DateOfBirth: new Date(2000, 0, 1).toISOString(),
    Gender: 2,
  })
  const raw = unwrap<UserResponseDTO>(resp)
  return raw ? mapFromBackend(raw) : MOCK_PROFILE
}

/** Upload file lên /api/media/upload */
async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData()
  form.append("file", file)   // backend IFormFile tên là "file"
  const resp = await api.post("/api/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  // Backend trả: { success, message, url }
  const url = resp.data?.url ?? ""
  return { avatarUrl: url }
}

export const userService = { getProfile, getMyProfile, updateProfile, uploadAvatar }
