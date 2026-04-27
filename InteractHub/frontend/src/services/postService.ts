import api, { unwrap } from "./api";

// gọi các endpoint liên quan đến Post (CRUD).
// - Sử dụng `unwrap(resp)` để lấy payload theo chuẩn ApiResponse<T> từ backend.
// - Trả về dữ liệu đã unwrap để component dễ dùng.

export interface PostResponseDto {
  id: string;
  userId: string;
  content?: string;
  visibility?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostDto {
  userId: string;
  content?: string;
  visibility?: string;
}

export interface UpdatePostDto {
  content?: string;
  visibility?: string;
}

// NOTE (2026-04-27):
// - Thêm ngày 27/04/2026: các hàm CRUD cho Post được tạo để kết nối với backend.
// - getAllPosts gọi GET /api/post và trả về danh sách PostResponseDto đã unwrap.
export async function getAllPosts() {
  const resp = await api.get("/api/post");
  return unwrap<any[]>(resp) ?? [];
}

export async function getPostById(id: string) {
  const resp = await api.get(`/api/post/${id}`);
  return unwrap(resp);
}

export async function createPost(payload: CreatePostDto) {
  const resp = await api.post(`/api/post`, payload);
  return unwrap(resp);
}

export async function updatePost(id: string, payload: UpdatePostDto) {
  const resp = await api.put(`/api/post/${id}`, payload);
  return unwrap(resp);
}

export async function deletePost(id: string) {
  const resp = await api.delete(`/api/post/${id}`);
  return unwrap(resp);
}
