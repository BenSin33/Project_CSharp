import api, { unwrap } from "./api"

export interface CreateStoryDTO {
  storyContent?: string
  mediaUrl: string        // required theo backend
}

export interface StoryResponseDTO {
  id: string
  userId: string
  storyContent?: string
  mediaUrl: string
  expireAt: string
  createdAt: string
}

// const MOCK_STORIES: StoryResponseDTO[] = [
//   { id: "1", userId: "demo-1", mediaUrl: "https://picsum.photos/seed/s1/400/700", expireAt: "", createdAt: "" },
//   { id: "2", userId: "demo-2", mediaUrl: "https://picsum.photos/seed/s2/400/700", expireAt: "", createdAt: "" },
// ]

// GET /api/story/active  — anonymous
async function getActiveStories(): Promise<StoryResponseDTO[]> {
  const resp = await api.get("/api/story/active")
  return unwrap<StoryResponseDTO[]>(resp) ?? []
}

// GET /api/story/user/{userId}  — anonymous
async function getUserStories(userId: string): Promise<StoryResponseDTO[]> {
  const resp = await api.get(`/api/story/user/${userId}`)
  return unwrap<StoryResponseDTO[]>(resp) ?? []
}

// POST /api/story  — requires auth
async function createStory(payload: CreateStoryDTO): Promise<StoryResponseDTO> {
  const resp = await api.post("/api/story", payload)
  return unwrap<StoryResponseDTO>(resp)!
}

// DELETE /api/story/{id}  — requires auth
async function deleteStory(id: string): Promise<boolean> {
  const resp = await api.delete(`/api/story/${id}`)
  return unwrap<boolean>(resp) ?? false
}

export const storyService = { getActiveStories, getUserStories, createStory, deleteStory }