import api, { unwrap } from "./api";

// Ghi chú (VN):
// Service cho Comment: lấy, thêm, xóa comment. Lưu ý backend có route GET `pót` —
// giữ nguyên để tương thích; nếu backend sửa route thì cần update ở đây.

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

export async function getCommentsByPost(postId: string) {
  const resp = await api.get(`/api/comment/pót/${postId}`); // note: backend route uses 'pót' upstream; keep same
  return unwrap<any[]>(resp) ?? [];
}

export async function addComment(payload: CreateCommentDTO) {
  const resp = await api.post(`/api/comment`, payload);
  return unwrap(resp);
}

export async function deleteComment(id: string) {
  const resp = await api.delete(`/api/comment/${id}`);
  return unwrap(resp);
}
