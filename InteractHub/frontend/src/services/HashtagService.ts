import api from "./api"

export interface HashTagDto {
  id: string
  name: string
  postCount: number
}

const HASHTAG_COLORS = [
  "#dbeafe", "#d1fae5", "#fce7f3", "#fef3c7", "#ffedd5",
  "#ede9fe", "#fee2e2", "#ecfdf5", "#f0f9ff", "#fdf4ff",
]

export function getHashtagColor(index: number): string {
  return HASHTAG_COLORS[index % HASHTAG_COLORS.length]
}

/**
 * GET /api/hashtag
 * Lấy danh sách hashtags từ backend
 */
export async function getAllHashtags(): Promise<HashTagDto[]> {
  const resp = await api.get("/api/hashtag")
  const data = resp?.data?.data
  if (!Array.isArray(data)) return []
  return data as HashTagDto[]
}