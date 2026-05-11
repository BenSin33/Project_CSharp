import api, { unwrap } from "./api"

// ─── DTOs khớp với backend PostResponseDto ──────────────────────────────────

export interface UserBasicDto {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  bio?: string
}

export interface PostMediaDto {
  url: string
  mediaType: string
}

export interface LikePreviewDto {
  id: string
  user?: UserBasicDto
  reactionType: string
  createdAt: string
}

export interface LikeSummaryDto {
  totalLikes: number
  reactionCounts: Record<string, number>
  currentUserReaction?: number | null
  topLikes: LikePreviewDto[]
}

export interface CommentDetailDto {
  id: string
  postId: string
  content: string
  user?: UserBasicDto
  createdAt: string
  updatedAt: string
}

/** Backend PostResponseDto đầy đủ */
export interface BackendPostDto {
  id: string
  userId: string
  content?: string
  visibility?: string
  status?: string
  createdAt: string
  updatedAt: string
  mediaItems?: PostMediaDto[]

  // Fields mới sau khi update backend
  author?: UserBasicDto
  likeCount?: number
  commentCount?: number
  shareCount?: number
  isSavedByCurrentUser?: boolean
  likeSummary?: LikeSummaryDto
  topComments?: CommentDetailDto[]
  hashTags?: string[]
}

/** Paginated wrapper mà backend trả về */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  skip: number
  take: number
  totalPages: number
  hasNextPage: boolean
}

// ─── PostDto dùng trong frontend ─────────────────────────────────────────────

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
  isLiked: boolean
  isSaved: boolean
  visibility?: string
  topComments: CommentDetailDto[]   // top 5 comments embedded in post
  likeSummary?: LikeSummaryDto
  hashTags?: string[]
}

// ─── Mapper ─────────────────────────────────────────────────────────────────

export function mapFromBackend(p: BackendPostDto): PostDto {
  const firstMedia = p.mediaItems?.[0]
  console.log('kaaka: ',p);
  return {
    id:     String(p.id),
    author: {
      id:        String(p.author?.id ?? p.userId),
      name:      p.author?.fullName ?? "User",
      avatarUrl: p.author?.avatarUrl,
    },
    content:       p.content ?? "",
    imageUrl:      firstMedia?.url,
    likes:         p.likeCount    ?? 0,
    shares:        p.shareCount   ?? 0,
    commentsCount: p.commentCount ?? 0,
    createdAt:     p.createdAt,
    visibility:    p.visibility,
    // isLiked: true nếu backend trả currentUserReaction khác null/undefined
    // (có thể là số 0-5 hoặc string "LIKE","LOVE"... tuỳ cấu hình backend)
    isLiked:       p.likeSummary?.currentUserReaction !== null && p.likeSummary?.currentUserReaction !== undefined,
    isSaved:       p.isSavedByCurrentUser ?? false,
    topComments:   p.topComments ?? [],
    likeSummary:   p.likeSummary,
    hashTags:      p.hashTags ?? [],
  }
}

// ─── API Calls ───────────────────────────────────────────────────────────────

/**
 * GET /api/post?skip=&take=
 * Trả về PaginatedResponse<PostDto>
 */
export async function getAllPosts(skip = 0, take = 20): Promise<PaginatedResponse<PostDto>> {
  const resp = await api.get("/api/post")
  
  // ── DEBUG: xem đúng cấu trúc backend trả về ──
  console.log("[postService] raw resp.data:", JSON.stringify(resp?.data, null, 2))

  // Backend trả ApiResponse<PaginatedResponse<T>>:
  // resp.data = { success, data: { data: [...], total, skip, take }, message }
  // Nhưng nếu resp.data.data là array thẳng (không có .data bên trong)
  // thì backend đang trả ApiResponse<List<T>> — cần handle cả 2 case
  const outer = resp?.data         // ApiResponse wrapper
  const inner = outer?.data        // PaginatedResponse hoặc array

  console.log("[postService] outer.success:", outer?.success)
  console.log("[postService] inner type:", Array.isArray(inner) ? "ARRAY" : typeof inner)
  if (inner && !Array.isArray(inner)) {
    console.log("[postService] inner.data type:", Array.isArray(inner?.data) ? "ARRAY" : typeof inner?.data)
    console.log("[postService] inner keys:", Object.keys(inner))
  }

  if (!inner) return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }

  // Case 1: inner là PaginatedResponse { data: [...], total, skip, take }
  if (!Array.isArray(inner) && Array.isArray(inner?.data)) {
    return {
      data:        inner.data.map(mapFromBackend),
      total:       inner.total       ?? inner.data.length,
      skip:        inner.skip        ?? skip,
      take:        inner.take        ?? take,
      totalPages:  inner.totalPages  ?? 1,
      hasNextPage: inner.hasNextPage ?? false,
    }
  }

  // Case 2: inner là array thẳng (backend trả ApiResponse<List<T>>)
  if (Array.isArray(inner)) {
    return {
      data:        inner.map(mapFromBackend),
      total:       inner.length,
      skip:        0,
      take:        inner.length,
      totalPages:  1,
      hasNextPage: false,
    }
  }

  return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
}

/** Alias cho getFeed (dùng ở nơi cũ) */
export async function getFeed(skip = 0, take = 20) {
  return getAllPosts(skip, take)
}

/** GET /api/post/{id} */
export async function getPostById(id: string): Promise<PostDto | undefined> {
  const resp = await api.get(`/api/post/${id}`)
  const raw = unwrap<BackendPostDto>(resp)
  return raw ? mapFromBackend(raw) : undefined
}

// ─── Search ──────────────────────────────────────────────────────────────────

/**
 * GET /api/post/search?q=&skip=&take=
 * Tìm bài viết theo nội dung hoặc tên tác giả
 */
export async function searchPosts(q: string, skip = 0, take = 20): Promise<PaginatedResponse<PostDto>> {
  const resp = await api.get("/api/post/search", { params: { q, skip, take } })
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
}

// ─── Create / Update / Delete ────────────────────────────────────────────────

export interface CreatePostPayload {
  userId: string
  content?: string
  visibility?: number   // 0=Public, 1=Friends, 2=Private
  mediaItems?: Array<{ url: string; mediaType?: number }>
}

export async function createPost(payload: CreatePostPayload): Promise<PostDto> {
  const resp = await api.post("/api/post", {
    UserId:     payload.userId,
    Content:    payload.content,
    Visibility: payload.visibility ?? 0,
    MediaItems: payload.mediaItems ?? [],
  })
  const raw = unwrap<BackendPostDto>(resp)!
  return mapFromBackend(raw)
}

export async function updatePost(id: string, payload: { content?: string; visibility?: number }): Promise<PostDto> {
  const resp = await api.put(`/api/post/${id}`, {
    Content:    payload.content,
    Visibility: payload.visibility,
  })
  const raw = unwrap<BackendPostDto>(resp)!
  return mapFromBackend(raw)
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/api/post/${id}`)
}

export async function getPostsByUser(userId: string, skip = 0, take = 20): Promise<PaginatedResponse<PostDto>> {
  const resp = await api.get(`/api/post/user/${userId}`, { params: { skip, take } })
  const outer = resp?.data
  const inner = outer?.data
  if (!inner) return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
  if (!Array.isArray(inner) && Array.isArray(inner?.data)) {
    return {
      data: inner.data.map(mapFromBackend),
      total: inner.total ?? inner.data.length,
      skip: inner.skip ?? skip,
      take: inner.take ?? take,
      totalPages: inner.totalPages ?? 1,
      hasNextPage: inner.hasNextPage ?? false,
    }
  }
  if (Array.isArray(inner)) {
    return { data: inner.map(mapFromBackend), total: inner.length, skip: 0, take: inner.length, totalPages: 1, hasNextPage: false }
  }
  return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
}

/**
 * GET /api/post/trending?skip=&take=
 * Trending posts: sorted by likes, with images only
 */
/**
 * GET /api/post/reels?skip=&take=
 * Reel posts: video posts sorted by likes
 */
export async function getReelPosts(skip = 0, take = 6): Promise<PaginatedResponse<PostDto>> {
  const resp = await api.get("/api/post/reels", { params: { skip, take } })
  const outer = resp?.data
  const inner = outer?.data
  if (!inner) return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
  if (!Array.isArray(inner) && Array.isArray(inner?.data)) {
    return {
      data: inner.data.map(mapFromBackend),
      total: inner.total ?? inner.data.length,
      skip: inner.skip ?? skip,
      take: inner.take ?? take,
      totalPages: inner.totalPages ?? 1,
      hasNextPage: inner.hasNextPage ?? false,
    }
  }
  if (Array.isArray(inner)) {
    return { data: inner.map(mapFromBackend), total: inner.length, skip: 0, take: inner.length, totalPages: 1, hasNextPage: false }
  }
  return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
}

export async function getTrendingPosts(skip = 0, take = 6): Promise<PaginatedResponse<PostDto>> {
  const resp = await api.get("/api/post/trending", { params: { skip, take } })
  const outer = resp?.data
  const inner = outer?.data
  if (!inner) return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
  if (!Array.isArray(inner) && Array.isArray(inner?.data)) {
    return {
      data: inner.data.map(mapFromBackend),
      total: inner.total ?? inner.data.length,
      skip: inner.skip ?? skip,
      take: inner.take ?? take,
      totalPages: inner.totalPages ?? 1,
      hasNextPage: inner.hasNextPage ?? false,
    }
  }
  if (Array.isArray(inner)) {
    return { data: inner.map(mapFromBackend), total: inner.length, skip: 0, take: inner.length, totalPages: 1, hasNextPage: false }
  }
  return { data: [], total: 0, skip, take, totalPages: 0, hasNextPage: false }
}