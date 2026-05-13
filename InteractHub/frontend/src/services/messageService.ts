import api, { unwrap } from "./api"

/** Tương ứng MessageResponseDTO backend — backend C# record trả PascalCase hoặc camelCase tuỳ cấu hình */
export interface MessageResponseDTO {
  // camelCase (khi backend dùng JsonNamingPolicy.CamelCase)
  id?: string
  messageContent?: string
  senderId?: string
  senderName?: string
  senderAvatar?: string
  receiverId?: string
  receiverName?: string
  receiverAvatar?: string
  sentAt?: string
  isRead?: boolean
  // PascalCase fallback (khi backend không cấu hình camelCase)
  Id?: string
  MessageContent?: string
  SenderId?: string
  SenderName?: string
  SenderAvatar?: string
  ReceiverId?: string
  ReceiverName?: string
  ReceiverAvatar?: string
  SentAt?: string
  IsRead?: boolean
}

/** Normalize PascalCase/camelCase thành camelCase thống nhất */
export function normalizeMessage(raw: any): NormalizedMessage {
  return {
    id:             String(raw.id ?? raw.Id ?? ""),
    messageContent: raw.messageContent ?? raw.MessageContent ?? "",
    senderId:       String(raw.senderId ?? raw.SenderId ?? ""),
    senderName:     raw.senderName ?? raw.SenderName ?? "",
    senderAvatar:   raw.senderAvatar ?? raw.SenderAvatar,
    receiverId:     String(raw.receiverId ?? raw.ReceiverId ?? ""),
    receiverName:   raw.receiverName ?? raw.ReceiverName ?? "",
    receiverAvatar: raw.receiverAvatar ?? raw.ReceiverAvatar,
    sentAt:         raw.sentAt ?? raw.SentAt ?? new Date().toISOString(),
    isRead:         raw.isRead ?? raw.IsRead ?? false,
  }
}

export interface NormalizedMessage {
  id: string
  messageContent: string
  senderId: string
  senderName: string
  senderAvatar?: string
  receiverId: string
  receiverName: string
  receiverAvatar?: string
  sentAt: string
  isRead: boolean
}

/** Tương ứng ConversationDTO backend */
export interface ConversationDTO {
  userId?: string
  userName?: string
  userAvatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  // PascalCase fallback
  UserId?: string
  UserName?: string
  UserAvatar?: string
  LastMessage?: string
  LastMessageTime?: string
  UnreadCount?: number
}

export function normalizeConversation(raw: any) {
  return {
    userId:          String(raw.userId ?? raw.UserId ?? ""),
    userName:        raw.userName ?? raw.UserName ?? "",
    userAvatar:      raw.userAvatar ?? raw.UserAvatar,
    lastMessage:     raw.lastMessage ?? raw.LastMessage,
    lastMessageTime: raw.lastMessageTime ?? raw.LastMessageTime ?? new Date().toISOString(),
    unreadCount:     raw.unreadCount ?? raw.UnreadCount ?? 0,
  }
}

export interface CreateMessageDTO {
  messageContent: string
  receiverId: string
}

// POST /api/message/send
export async function sendMessage(payload: CreateMessageDTO): Promise<NormalizedMessage> {
  const resp = await api.post("/api/message/send", {
    MessageContent: payload.messageContent,
    ReceiverId: payload.receiverId,
  })
  const raw = resp.data?.data ?? resp.data
  return normalizeMessage(raw)
}

// GET /api/message/conversation/{otherUserId}
export async function getConversation(otherUserId: string): Promise<NormalizedMessage[]> {
  const resp = await api.get(`/api/message/conversation/${otherUserId}`)
  const raw = unwrap<any[]>(resp) ?? []
  return raw.map(normalizeMessage)
}

// GET /api/message/conversations
export async function getConversations(): Promise<ReturnType<typeof normalizeConversation>[]> {
  const resp = await api.get("/api/message/conversations")
  const raw = unwrap<any[]>(resp) ?? []
  return raw.map(normalizeConversation)
}

// GET /api/message/{messageId}
export async function getMessageById(messageId: string): Promise<NormalizedMessage | undefined> {
  const resp = await api.get(`/api/message/${messageId}`)
  const raw = unwrap<any>(resp)
  return raw ? normalizeMessage(raw) : undefined
}

// PUT /api/message/{messageId}/mark-as-read
export async function markAsRead(messageId: string): Promise<boolean> {
  const resp = await api.put(`/api/message/${messageId}/mark-as-read`)
  return resp.data?.success ?? false
}

// DELETE /api/message/{messageId}
export async function deleteMessage(messageId: string): Promise<boolean> {
  const resp = await api.delete(`/api/message/${messageId}`)
  return resp.data?.success ?? false
}

// GET /api/message/unread-count
export async function getUnreadCount(): Promise<number> {
  try {
    const resp = await api.get("/api/message/unread-count")
    const data = unwrap<any>(resp)
    return data?.unreadCount ?? data?.UnreadCount ?? 0
  } catch {
    return 0
  }
}

export const messageService = {
  sendMessage,
  getConversation,
  getConversations,
  getMessageById,
  markAsRead,
  deleteMessage,
  getUnreadCount,
}