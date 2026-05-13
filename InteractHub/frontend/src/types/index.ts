// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  roles?: string[];
}

// ─── Post ─────────────────────────────────────────────────────────────────────
export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

import type { LikeSummaryDto } from "../services/postService";

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  imageUrl?: string;
  likes: number;
  shares: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  likeSummary?: LikeSummaryDto;
  originalPost?: Post;
  status?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotifType = "like" | "comment" | "friend_request" | "friend_accept" | "share" | "mention" | "message";

export interface Notification {
  id: string;
  type: NotifType;
  actor: { name: string; avatarUrl?: string };
  message: string;
  timeAgo: string;
  isRead: boolean;
}

// ─── Story ────────────────────────────────────────────────────────────────────
export interface Story {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  imageUrl?: string;
  viewed: boolean;
  active: boolean;
  expiresAt?: string;
  createdAt?: string;
}

export interface StoryGroup {
  userId: string;
  username: string;
  avatarUrl?: string;
  stories: Story[];
}

// ─── Message ──────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  text: string;
  time: string;
  isMine: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  unreadCount?: number;
  avatarUrl?: string;
  avatarColor?: string;
  avatarTextColor?: string;
}

// ─── Hashtag ──────────────────────────────────────────────────────────────────
export interface HashtagItem {
  id: string;
  tag: string;
  postCount: number;
}

// ─── Friend ───────────────────────────────────────────────────────────────────
export interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  timeAgo: string;
  avatarUrl?: string;
}

export interface SuggestedUser {
  id: string;
  name: string;
  label?: string;
  avatarUrl?: string;
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
export interface TabOption {
  label: string;
  value: string;
}