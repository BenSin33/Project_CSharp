import api, { unwrap } from "./api"
import { MOCK_POSTS } from "../constants/mock"

export interface PostMediaDto {
  mediaUrl: string
  mediaType: string  // e.g. "image/jpeg"
}

export interface PostAuthor {
  id: string
  name: string
  avatarUrl?: string
}

export interface PostDto {
  id: string
  author: PostAuthor
  content: string
  imageUrl?: string
  likes: number
  shares: number
  commentsCount: number
  createdAt: string
  isLiked?: boolean
  isSaved?: boolean
  visibility?: string
}

/** Backend PostResponseDto shape */
interface BackendPostDto {
  id: string
  userId: string
  content?: string
  visibility?: string
  status?: string
  createdAt: string
  updatedAt: string
  mediaItems?: PostMediaDto[]
}

function mapFromBackend(p: BackendPostDto): PostDto {
  const firstMedia = p.mediaItems?.[0]
  return {
    id: String(p.id),
    author: {
      id: String(p.userId),
      name: "",         // Backend chưa trả tên author trong PostResponseDto
      avatarUrl: undefined,
    },
    content: p.content ?? "",
    imageUrl: firstMedia?.mediaUrl,
    likes: 0,           // Lấy riêng từ /api/like/post/{id}
    shares: 0,          // Lấy riêng từ /api/share/post/{id}
    commentsCount: 0,   // Lấy riêng từ /api/comment/post/{id}
    createdAt: p.createdAt,
    visibility: p.visibility,
  }
}

export interface CreatePostPayload {
  userId: string          // bắt buộc theo backend
  content?: string
  visibility?: number     // 0=Public, 1=Friends, 2=Private
  mediaItems?: PostMediaDto[]
}

export interface UpdatePostPayload {
  content?: string
  visibility?: number
}

export async function getFeed(): Promise<PostDto[]> {
  return getAllPosts()
}

export async function getAllPosts(): Promise<PostDto[]> {
  try {
    const resp = await api.get("/api/post")
    const raw = unwrap<BackendPostDto[]>(resp) ?? []
    return raw.map(mapFromBackend)
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) return MOCK_POSTS
    throw err
  }
}

export async function getPostById(id: string): Promise<PostDto | undefined> {
  const resp = await api.get(`/api/post/${id}`)
  const raw = unwrap<BackendPostDto>(resp)
  return raw ? mapFromBackend(raw) : undefined
}

/**
 * Tạo post mới.
 * Backend CreatePostDto yêu cầu: UserId, Content, Visibility (enum), MediaItems[]
 */
export async function createPost(payload: CreatePostPayload): Promise<PostDto> {
  const resp = await api.post("/api/post", {
    UserId: payload.userId,
    Content: payload.content,
    Visibility: payload.visibility ?? 0,   // 0=Public
    MediaItems: payload.mediaItems ?? [],
  })
  const raw = unwrap<BackendPostDto>(resp)!
  return mapFromBackend(raw)
}

export async function updatePost(id: string, payload: UpdatePostPayload): Promise<PostDto> {
  const resp = await api.put(`/api/post/${id}`, {
    Content: payload.content,
    Visibility: payload.visibility,
  })
  const raw = unwrap<BackendPostDto>(resp)!
  return mapFromBackend(raw)
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/api/post/${id}`)
}

// Giữ lại interface cũ để không break code hiện tại
export interface CreatePostDto {
  content: string
  imageUrl?: string
  visibility?: string
}
export interface UpdatePostDto {
  content?: string
  visibility?: string
}
