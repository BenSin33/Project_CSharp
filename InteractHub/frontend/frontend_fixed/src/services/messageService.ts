import api, { unwrap } from "./api"

/** Tương ứng MessageResponseDTO backend */
export interface MessageResponseDTO {
  id: string
  messageContent?: string
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
  userId: string
  userName: string
  userAvatar?: string
  lastMessage?: string
  lastMessageTime: string
  unreadCount: number
}

export interface CreateMessageDTO {
  messageContent: string
  receiverId: string
}

// POST /api/message/send — auth required, lấy senderId từ JWT
export async function sendMessage(payload: CreateMessageDTO): Promise<MessageResponseDTO> {
  const resp = await api.post("/api/message/send", {
    MessageContent: payload.messageContent,
    ReceiverId: payload.receiverId,
  })
  return resp.data?.data ?? resp.data
}

// GET /api/message/conversation/{otherUserId} — auth required
export async function getConversation(otherUserId: string): Promise<MessageResponseDTO[]> {
  const resp = await api.get(`/api/message/conversation/${otherUserId}`)
  return unwrap<MessageResponseDTO[]>(resp) ?? []
}

// GET /api/message/conversations — auth required
export async function getConversations(): Promise<ConversationDTO[]> {
  const resp = await api.get("/api/message/conversations")
  return unwrap<ConversationDTO[]>(resp) ?? []
}

// GET /api/message/{messageId}
export async function getMessageById(messageId: string): Promise<MessageResponseDTO | undefined> {
  const resp = await api.get(`/api/message/${messageId}`)
  return unwrap<MessageResponseDTO>(resp)
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
    return resp.data?.unreadCount ?? 0
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
