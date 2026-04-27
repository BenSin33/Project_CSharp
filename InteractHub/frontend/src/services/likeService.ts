import api, { unwrap } from "./api";

//  Like: lấy summary và toggle like. Backend trả ApiResponse<T>,
// vì vậy dùng `unwrap` để lấy phần data thực.

export interface LikeSummaryDTO {
  totalLikes: number;
  reactionCounts: Record<string, number>;
  currentUserReaction?: string | null;
}

export interface ToggleLikeDTO {
  postId: string;
  type: string; // e.g., "LIKE", "LOVE"
}

export async function getLikeSummary(postId: string) {
  const resp = await api.get(`/api/like/post/${postId}`);
  // NOTE (2026-04-27): endpoint trả ApiResponse<LikeSummaryDTO>
  return unwrap<LikeSummaryDTO>(resp);
}

export async function toggleLike(payload: ToggleLikeDTO) {
  const resp = await api.post(`/api/like/toggle`, payload);
  // NOTE (2026-04-27): toggle like - backend trả ApiResponse<bool>
  return unwrap<boolean>(resp);
}
