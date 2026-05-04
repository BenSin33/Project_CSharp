import api, { unwrap } from "./api";

export interface LikeSummaryDTO {
  totalLikes: number;
  reactionCounts: Record<string, number>;
  currentUserReaction?: number | null; // enum LikeType: 0=LIKE,1=LOVE,2=HAHA,3=WOW,4=SAD,5=ANGRY
}

// Enum khớp với LikeType backend
export enum LikeType {
  LIKE  = 0,
  LOVE  = 1,
  HAHA  = 2,
  WOW   = 3,
  SAD   = 4,
  ANGRY = 5,
}

export interface ToggleLikeDTO {
  postId: string;
  type: LikeType;  // số nguyên — backend dùng enum, không phải string
}

// GET /api/like/post/{postId}
export async function getLikeSummary(postId: string) {
  const resp = await api.get(`/api/like/post/${postId}`);
  return unwrap<LikeSummaryDTO>(resp);
}

// POST /api/like/toggle — backend lấy userId từ JWT
export async function toggleLike(payload: ToggleLikeDTO) {
  const resp = await api.post(`/api/like/toggle`, {
    PostId: payload.postId,
    Type: payload.type,  // số nguyên
  });
  return unwrap<boolean>(resp);
}
