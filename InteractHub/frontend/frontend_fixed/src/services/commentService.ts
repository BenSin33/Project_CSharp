import api, { unwrap } from "./api";

export interface CreateCommentDTO {
  postId: string;
  content: string;
}

export interface CommentResponseDTO {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/comment/post/{postId}  (backend route: [controller]/post/{postId})
export async function getCommentsByPost(postId: string) {
  const resp = await api.get(`/api/comment/post/${postId}`);
  return unwrap<CommentResponseDTO[]>(resp) ?? [];
}

// POST /api/comment  — backend lấy userId từ JWT, chỉ cần postId + content
export async function addComment(payload: CreateCommentDTO) {
  const resp = await api.post(`/api/comment`, {
    PostId: payload.postId,
    Content: payload.content,
  });
  return unwrap<CommentResponseDTO>(resp);
}

// DELETE /api/comment/{id}
export async function deleteComment(id: string) {
  const resp = await api.delete(`/api/comment/${id}`);
  return unwrap<boolean>(resp);
}
