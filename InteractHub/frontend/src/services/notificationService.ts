import api, { unwrap } from "./api"

export type NotifType = "like" | "comment" | "friend_request" | "share" | "mention"

export interface NotificationDto {
  id: string
  type: NotifType
  actor: { name: string; avatarUrl?: string }
  message: string
  timeAgo: string
  isRead: boolean
}

export interface CreateNotificationDTO {
  userId: string
  type: NotifType
  message: string
  actorId?: string
}

const MOCK_NOTIFICATIONS: NotificationDto[] = [
  { id:"1", type:"like",           actor:{ name:"Sarah Johnson"  }, message:"liked your post",           timeAgo:"4 days ago", isRead:false },
  { id:"2", type:"comment",        actor:{ name:"Michael Chen"   }, message:"commented on your post",    timeAgo:"4 days ago", isRead:false },
  { id:"3", type:"friend_request", actor:{ name:"Sarah Johnson"  }, message:"sent you a friend request", timeAgo:"5 days ago", isRead:false },
  { id:"4", type:"share",          actor:{ name:"David Williams" }, message:"shared your post",          timeAgo:"5 days ago", isRead:true  },
  { id:"5", type:"mention",        actor:{ name:"Michael Chen"   }, message:"mentioned you in a comment",timeAgo:"6 days ago", isRead:true  },
]

// GET /api/notifications?skip=0&take=10
async function getNotifications(skip = 0, take = 10): Promise<NotificationDto[]> {
  try {
    const resp = await api.get("/api/notifications", { params: { skip, take } })
    return unwrap<NotificationDto[]>(resp) ?? []
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) return MOCK_NOTIFICATIONS
    throw err
  }
}

// GET /api/notifications/{id}
async function getNotificationById(id: string): Promise<NotificationDto | undefined> {
  const resp = await api.get(`/api/notifications/${id}`)
  return unwrap<NotificationDto>(resp)
}

// POST /api/notifications
async function createNotification(payload: CreateNotificationDTO): Promise<NotificationDto> {
  const resp = await api.post("/api/notifications", payload)
  return unwrap<NotificationDto>(resp)!
}

// PUT /api/notifications/{id}/read  ← đây là PUT, không phải POST
async function markRead(id: string): Promise<void> {
  await api.put(`/api/notifications/${id}/read`)
}

// PUT /api/notifications/mark-all-read  ← PUT, không phải POST
async function markAllRead(): Promise<void> {
  try {
    await api.put("/api/notifications/mark-all-read")
  } catch {
    // optimistic — ignore if offline
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