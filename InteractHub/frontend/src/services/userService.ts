import api, { unwrap } from "./api"

// ─── DTOs ────────────────────────────────────────────────────────────────────

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
  emailNotifications?: boolean
  pushNotifications?: boolean
  privateAccount?: boolean
  showOnlineStatus?: boolean
  whoCanComment?: string
  whoCanSendFriendRequest?: string
  whoCanSeeFriendsList?: string
}

/** PaginatedResponse generic */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  skip: number
  take: number
  totalPages: number
  hasNextPage: boolean
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
  roles?: string[]
  joinedAt: string
  followingCount: number
  followersCount: number
  postsCount: number
  isOwner?: boolean
  settings?: UserSettingsDto
}

export interface UserSettingsDto {
  emailNotifications: boolean
  pushNotifications: boolean
  privateAccount: boolean
  showOnlineStatus: boolean
  whoCanComment: string
  whoCanSendFriendRequest: string
  whoCanSeeFriendsList: string
}

function mapFromBackend(d: UserResponseDTO): UserProfileDto {
  return {
    id:             String(d.id),
    name:           d.fullName ?? (d as any).FullName,
    username:       d.email.split("@")[0],
    email:          d.email,
    avatarUrl:      d.avatarUrl ?? (d as any).AvatarUrl,
    bio:            d.bio ?? (d as any).Bio,
    location:       d.location ?? (d as any).Location,
    roles:          d.roles ?? (d as any).Roles ?? [],
    joinedAt:       (d as any).createdAt ?? (d as any).CreatedAt ?? "",
    followingCount: 0,
    followersCount: 0,
    postsCount:     0,
    settings: {
      emailNotifications: d.emailNotifications ?? true,
      pushNotifications: d.pushNotifications ?? true,
      privateAccount: d.privateAccount ?? false,
      showOnlineStatus: d.showOnlineStatus ?? true,
      whoCanComment: d.whoCanComment ?? "Everyone",
      whoCanSendFriendRequest: d.whoCanSendFriendRequest ?? "Everyone",
      whoCanSeeFriendsList: d.whoCanSeeFriendsList ?? "Everyone",
    }
  }
}

const MOCK_PROFILE: UserProfileDto = {
  id:             "demo-1",
  name:           "Alex Kim",
  username:       "alexkim",
  email:          "demo@user.com",
  bio:            "Living life one post at a time ✨",
  location:       "Ho Chi Minh City",
  joinedAt:       "2024",
  followingCount: 180,
  followersCount: 245,
  postsCount:     42,
  isOwner:        true,
}

// ─── API Calls ───────────────────────────────────────────────────────────────

/** GET /api/user/{id} */
async function getProfile(userId: string): Promise<UserProfileDto> {
  try {
    const resp = await api.get(`/api/user/${userId}`)
    const raw  = unwrap<UserResponseDTO>(resp)
    return raw ? mapFromBackend(raw) : MOCK_PROFILE
  } catch (err: any) {
    if (
      err?.code === "ERR_NETWORK" ||
      err?.response?.status >= 500 ||
      err?.response?.status === 403
    ) {
      return MOCK_PROFILE
    }
    throw err
  }
}

/** GET /api/auth/profile — user đang đăng nhập */
async function getMyProfile(): Promise<UserProfileDto> {
  try {
    const resp = await api.get("/api/auth/profile")
    const d    = resp.data?.data ?? resp.data // Mở hộp data từ ApiResponse
    return {
      id:             String(d?.id ?? d?.Id ?? ""),
      name:           d?.fullName ?? d?.FullName ?? "",
      username:       (d?.email ?? "").split("@")[0],
      email:          d?.email ?? "",
      avatarUrl:      d?.avatarUrl ?? d?.AvatarUrl,
      bio:            d?.bio ?? d?.Bio,
      location:       d?.location ?? d?.Location,
      roles:          d?.roles ?? d?.Roles ?? [],
      joinedAt:       d?.createdAt ?? d?.CreatedAt ?? "",
      followingCount: 0,
      followersCount: 0,
      postsCount:     0,
      isOwner:        true,
      settings: {
        emailNotifications: d?.emailNotifications ?? true,
        pushNotifications: d?.pushNotifications ?? true,
        privateAccount: d?.privateAccount ?? false,
        showOnlineStatus: d?.showOnlineStatus ?? true,
        whoCanComment: d?.whoCanComment ?? "Everyone",
        whoCanSendFriendRequest: d?.whoCanSendFriendRequest ?? "Everyone",
        whoCanSeeFriendsList: d?.whoCanSeeFriendsList ?? "Everyone",
      }
    }
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) {
      return { ...MOCK_PROFILE, isOwner: true }
    }
    throw err
  }
}

/**
 * GET /api/user/search?q=&skip=&take=
 * Tìm kiếm user theo tên, email, username — AllowAnonymous
 */
async function searchUsers(
  q: string,
  skip = 0,
  take = 20
): Promise<PaginatedResponse<UserResponseDTO>> {
  try {
    const resp = await api.get("/api/user/search", { params: { q, skip, take } })
    const raw  = unwrap<PaginatedResponse<UserResponseDTO>>(resp)
    if (!raw) return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
    return raw
  } catch (err: any) {
    console.error("searchUsers error:", err?.response?.data ?? err)
    return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
  }
}

export interface UpdateProfileDto {
  fullName?: string
  location?: string
  bio?: string
  avatarUrl?: string
}

async function updateProfile(userId: string, payload: UpdateProfileDto): Promise<UserProfileDto> {
  const resp = await api.put(`/api/user/${userId}`, {
    FullName:    payload.fullName ?? "",
    Location:    payload.location,
    AvatarUrl:   payload.avatarUrl,
    Bio:         payload.bio,
    DateOfBirth: new Date(2000, 0, 1).toISOString(),
    Gender:      2,
  })
  const raw = unwrap<UserResponseDTO>(resp)
  return raw ? mapFromBackend(raw) : MOCK_PROFILE
}

async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData()
  form.append("file", file)
  const resp = await api.post("/api/media/upload", form)
  // MediaController trả về ApiResponse<string> nên URL nằm ở resp.data.data
  const url = resp.data?.data ?? ""
  return { avatarUrl: url }
}

async function updateSettings(userId: string, payload: Partial<UserSettingsDto>): Promise<void> {
  const resp = await api.put(`/api/user/${userId}/settings`, payload)
  if (!resp.data?.success) {
    throw new Error(resp.data?.message ?? "Update settings failed")
  }
}

export const userService = {
  getProfile,
  getMyProfile,
  searchUsers,
  updateProfile,
  uploadAvatar,
  updateSettings,
}
