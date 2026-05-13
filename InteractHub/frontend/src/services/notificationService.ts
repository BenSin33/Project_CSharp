import api, { unwrap } from "./api"

// Enum NotificationType khớp backend:
// Like=0, Comment=1, Share=2, Message=3, FriendRequest=4, FriendAccept=5,
// PostMention=6, CommentMention=7, FriendPost=8
export type NotifType = "like" | "comment" | "friend_request" | "friend_accept" | "share" | "mention" | "message"

// Map enum số -> NotifType UI
const NOTIF_TYPE_MAP: Record<number, NotifType> = {
  0: "like",
  1: "comment",
  2: "share",
  3: "message",
  4: "friend_request",
  5: "friend_accept",
  6: "mention",
  7: "mention",
  8: "mention",
}

/** DTO trả về từ backend */
export interface NotificationResponseDTO {
  id: string
  content: string   // backend dùng 'content', không có 'message'
  type: number      // NotificationType enum (số nguyên)
  isRead: boolean
  userId: string
  actorId?: string
  actorName?: string
  actorAvatarUrl?: string
  createdAt: string
  updatedAt: string
}

/** DTO dùng trong UI */
export interface NotificationDto {
  id: string
  type: NotifType
  actor: { name: string; avatarUrl?: string }
  message: string
  timeAgo: string
  isRead: boolean
  raw: NotificationResponseDTO
}

/** DTO tạo notification — khớp backend CreateNotificationDTO */
export interface CreateNotificationDTO {
  content: string       // backend dùng 'content' (bắt buộc)
  type: number          // NotificationType enum số
  userId: string        // Guid — user nhận notification
}

function mapFromBackend(n: NotificationResponseDTO): NotificationDto {
  const typeKey = typeof n.type === "number" ? n.type : 0
  return {
    id: String(n.id),
    type: NOTIF_TYPE_MAP[typeKey] ?? "mention",
    actor: {
      name: (n as any).actorName ?? "System",
      avatarUrl: (n as any).actorAvatarUrl ?? undefined,
    },
    message: n.content,
    timeAgo: n.createdAt
      ? (() => {
          const diff = Date.now() - new Date(n.createdAt).getTime()
          const mins = Math.floor(diff / 60000)
          if (mins < 1) return "vừa xong"
          if (mins < 60) return `${mins} phút trước`
          const hours = Math.floor(mins / 60)
          if (hours < 24) return `${hours} giờ trước`
          const days = Math.floor(hours / 24)
          return `${days} ngày trước`
        })()
      : "",
    isRead: n.isRead,
    raw: n,
  }
}

async function getNotifications(skip = 0, take = 10): Promise<NotificationDto[]> {
  const resp = await api.get("/api/notifications", { params: { skip, take } })
  const raw = unwrap<NotificationResponseDTO[]>(resp) ?? []
  return raw.map(mapFromBackend)
}

// GET /api/notifications/{id}
async function getNotificationById(id: string): Promise<NotificationDto | undefined> {
  const resp = await api.get(`/api/notifications/${id}`)
  const raw = unwrap<NotificationResponseDTO>(resp)
  return raw ? mapFromBackend(raw) : undefined
}

// POST /api/notifications — backend nhận CreateNotificationDTO
async function createNotification(payload: CreateNotificationDTO): Promise<NotificationDto> {
  const resp = await api.post("/api/notifications", payload)
  const raw = unwrap<NotificationResponseDTO>(resp)!
  return mapFromBackend(raw)
}

// PUT /api/notifications/{id}/read
async function markRead(id: string): Promise<void> {
  await api.put(`/api/notifications/${id}/read`)
}

// PUT /api/notifications/mark-all-read
async function markAllRead(): Promise<void> {
  try {
    await api.put("/api/notifications/mark-all-read")
  } catch {
    // optimistic — bỏ qua nếu offline
  }
}

// DELETE /api/notifications/{id}
async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/api/notifications/${id}`)
}

// GET /api/notifications/unread/count
async function getUnreadCount(): Promise<number> {
  try {
    const resp = await api.get("/api/notifications/unread/count")
    return unwrap<number>(resp) ?? 0
  } catch {
    return 0
  }
}

export const notificationService = {
  getNotifications,
  getNotificationById,
  createNotification,
  markRead,
  markAllRead,
  deleteNotification,
  getUnreadCount,
}