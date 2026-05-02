import api, { unwrap } from "./api"
import type { BackendPostDto, PaginatedResponse, PostDto } from "./postService"
import { mapFromBackend } from "./postService"

export interface SavedPostResponseDto {
  id: string
  userId: string
  postId: string
  createdAt: string
  updatedAt: string
}

/**
 * POST /api/post/{id}/save
 * Lưu bài viết vào bookmark (cần đăng nhập)
 */
export async function savePost(postId: string): Promise<SavedPostResponseDto | null> {
  try {
    const resp = await api.post(`/api/post/${postId}/save`)
    return unwrap<SavedPostResponseDto>(resp) ?? null
  } catch (err: any) {
    console.error("savePost error:", err?.response?.data ?? err)
    return null
  }
}

/**
 * DELETE /api/post/{id}/unsave
 * Bỏ lưu bài viết (cần đăng nhập)
 */
export async function unsavePost(postId: string): Promise<boolean> {
  try {
    const resp = await api.delete(`/api/post/${postId}/unsave`)
    return unwrap<boolean>(resp) ?? false
  } catch (err: any) {
    console.error("unsavePost error:", err?.response?.data ?? err)
    return false
  }
}

/**
 * GET /api/post/saved?skip=&take=
 * Lấy danh sách bài viết đã lưu của user hiện tại (cần đăng nhập)
 */
export async function getSavedPosts(skip = 0, take = 20): Promise<PaginatedResponse<PostDto>> {
  try {
    const resp = await api.get("/api/post/saved", { params: { skip, take } })
    const raw = unwrap<PaginatedResponse<BackendPostDto>>(resp)
    if (!raw) return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
    return {
      data:        raw.data.map(mapFromBackend),
      total:       raw.total,
      skip:        raw.skip,
      take:        raw.take,
      totalPages:  raw.totalPages,
      hasNextPage: raw.hasNextPage,
    }
  } catch (err: any) {
    console.error("getSavedPosts error:", err?.response?.data ?? err)
    return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
  }
}

/**
 * Toggle: nếu đang saved thì unsave, ngược lại thì save.
 * Trả về trạng thái mới (true = đã save, false = đã unsave)
 */
export async function toggleSavePost(postId: string, currentlySaved: boolean): Promise<boolean> {
  if (currentlySaved) {
    await unsavePost(postId)
    return false
  } else {
    await savePost(postId)
    return true
  }
}
