import api, { unwrap } from "./api"

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateCommentDTO {
  postId: string
  content: string
}

/** Backend CommentResponseDTO (không có user name, chỉ có userId) */
export interface CommentResponseDTO {
  id: string
  userId: string
  postId: string
  content: string
  createdAt: string
  updatedAt: string
}

/** Backend CommentDetailDto (có user info đầy đủ — dùng trong topComments của Post) */
export interface CommentDetailDto {
  id: string
  postId: string
  content: string
  user?: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    bio?: string
  }
  createdAt: string
  updatedAt: string
}

/** Chuẩn hoá về 1 interface dùng trong PostCard */
export interface CommentItem {
  id: string
  userId: string
  content: string
  createdAt: string
  senderName?: string
  avatarUrl?: string
}

/** Map CommentDetailDto (có user info) → CommentItem */
export function mapDetailToItem(c: CommentDetailDto): CommentItem {
  return {
    id:         String(c.id),
    userId:     String(c.user?.id ?? ""),
    content:    c.content,
    createdAt:  c.createdAt,
    senderName: c.user?.fullName,
    avatarUrl:  c.user?.avatarUrl,
  }
}

/** Map CommentResponseDTO (chỉ có userId) → CommentItem */
export function mapResponseToItem(c: CommentResponseDTO): CommentItem {
  return {
    id:        String(c.id),
    userId:    String(c.userId),
    content:   c.content,
    createdAt: c.createdAt,
    senderName: undefined,   // API không trả tên — cần nâng cấp CommentController nếu muốn
  }
}

// ─── API Calls ───────────────────────────────────────────────────────────────

/**
 * GET /api/comment/post/{postId}
 * Trả về tất cả comment của post — AllowAnonymous
 */
export async function getCommentsByPost(postId: string): Promise<CommentItem[]> {
  const resp = await api.get(`/api/comment/post/${postId}`)
  const raw = unwrap<CommentDetailDto[]>(resp) ?? []
  return raw.map(mapDetailToItem)  // ← đổi từ mapResponseToItem sang mapDetailToItem
}

/**
 * POST /api/comment — cần đăng nhập (JWT)
 * Backend lấy userId từ token, chỉ cần postId + content
 */
export async function addComment(payload: CreateCommentDTO): Promise<CommentItem | undefined> {
  const resp = await api.post("/api/comment", {
    PostId:  payload.postId,
    Content: payload.content,
  })
  const raw = unwrap<CommentResponseDTO>(resp)
  return raw ? mapResponseToItem(raw) : undefined
}

/**
 * DELETE /api/comment/{id} — cần đăng nhập
 */
export async function deleteComment(id: string): Promise<boolean> {
  const resp = await api.delete(`/api/comment/${id}`)
  return unwrap<boolean>(resp) ?? false
}
