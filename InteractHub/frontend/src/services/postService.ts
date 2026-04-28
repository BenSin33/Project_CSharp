import api, { unwrap } from "./api"
import { MOCK_POSTS } from "../constants/mock"
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

export interface CreatePostDto {
  content: string
  imageUrl?: string
  visibility?: string
}

export interface UpdatePostDto {
  content?: string
  visibility?: string
}


export async function getFeed(): Promise<PostDto[]> {
  return getAllPosts()
}

export async function getAllPosts(): Promise<PostDto[]> {
  try {
    const resp = await api.get("/api/post")
    return unwrap<PostDto[]>(resp) ?? []
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) return MOCK_POSTS
    throw err
  }
}

export async function getPostById(id: string): Promise<PostDto | undefined> {
  const resp = await api.get(`/api/post/${id}`)
  return unwrap<PostDto>(resp)
}

export async function createPost(payload: CreatePostDto): Promise<PostDto> {
  const resp = await api.post("/api/post", payload)
  return unwrap<PostDto>(resp)!
}

export async function updatePost(id: string, payload: UpdatePostDto): Promise<PostDto> {
  const resp = await api.put(`/api/post/${id}`, payload)
  return unwrap<PostDto>(resp)!
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/api/post/${id}`)
}

