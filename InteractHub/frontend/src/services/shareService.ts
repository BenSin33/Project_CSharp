import api, { unwrap } from "./api"

export interface CreateShareDTO {
  postId: string
}

// GET /api/share/post/{postId}  — anonymous
export async function getShareCount(postId: string): Promise<number> {
  const resp = await api.get(`/api/share/post/${postId}`)
  return unwrap<number>(resp) ?? 0
}

// POST /api/share — backend lấy userId từ JWT, nhận CreateShareDTO { PostId }
export async function sharePost(payload: CreateShareDTO): Promise<boolean> {
  const resp = await api.post("/api/share", { PostId: payload.postId })
  return unwrap<boolean>(resp) ?? false
}

export const shareService = { getShareCount, sharePost }
