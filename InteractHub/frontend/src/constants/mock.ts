import type { Notification, Story, Conversation, Message, HashtagItem, Friend, FriendRequest, SuggestedUser, Post } from "../types";

// ─── Notifications ────────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "like",           actor: { name: "Sarah Johnson"  }, message: "liked your post",             timeAgo: "4 days ago", isRead: false },
  { id: "2", type: "comment",        actor: { name: "Michael Chen"   }, message: "commented on your post",      timeAgo: "4 days ago", isRead: false },
  { id: "3", type: "friend_request", actor: { name: "Sarah Johnson"  }, message: "sent you a friend request",   timeAgo: "5 days ago", isRead: false },
  { id: "4", type: "share",          actor: { name: "David Williams" }, message: "shared your post",            timeAgo: "5 days ago", isRead: true  },
  { id: "5", type: "mention",        actor: { name: "Michael Chen"   }, message: "mentioned you in a comment",  timeAgo: "6 days ago", isRead: true  },
];

// ─── Stories ──────────────────────────────────────────────────────────────────
export const MOCK_STORIES: (Story & { imageUrl?: string })[] = [
  { id: "2", userId: "u2", username: "Sarah",   avatarUrl: "https://i.pravatar.cc/150?img=47", viewed: false, active: true,  imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80" },
  { id: "3", userId: "u3", username: "Michael", avatarUrl: "https://i.pravatar.cc/150?img=12", viewed: false, active: true,  imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80" },
  { id: "4", userId: "u4", username: "David",   avatarUrl: "https://i.pravatar.cc/150?img=53", viewed: true,  active: false, imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80" },
  { id: "5", userId: "u5", username: "Emma",    avatarUrl: "https://i.pravatar.cc/150?img=9",  viewed: false, active: true,  imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80" },
  { id: "6", userId: "u6", username: "James",   avatarUrl: "https://i.pravatar.cc/150?img=33", viewed: true,  active: false, imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80" },
  { id: "7", userId: "u7", username: "Olivia",  avatarUrl: "https://i.pravatar.cc/150?img=21", viewed: false, active: true,  imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80" },
];

// ─── Messages ─────────────────────────────────────────────────────────────────
export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "1", name: "Sarah Johnson", preview: "Hey! How are you?",    time: "2m ago", unreadCount: 2, avatarColor: "#e0e7ff", avatarTextColor: "#4338ca" },
  { id: "2", name: "Mike Chen",     preview: "Thanks for the help!", time: "1h ago",                 avatarColor: "#fce7f3", avatarTextColor: "#9d174d" },
  { id: "3", name: "Emma Davis",    preview: "See you tomorrow!",    time: "3h ago",                 avatarColor: "#d1fae5", avatarTextColor: "#065f46" },
  { id: "4", name: "Alex Turner",   preview: "That sounds great!",   time: "5h ago", unreadCount: 1, avatarColor: "#fef3c7", avatarTextColor: "#92400e" },
  { id: "5", name: "James Wilson",  preview: "Let's catch up soon",  time: "1d ago",                 avatarColor: "#ede9fe", avatarTextColor: "#6d28d9" },
];

export const MOCK_INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", text: "Hey! How are you?",                  time: "10:30 AM", isMine: false },
    { id: "m2", text: "I'm doing great! Thanks for asking", time: "10:32 AM", isMine: true  },
    { id: "m3", text: "That's wonderful to hear!",          time: "10:33 AM", isMine: false },
  ],
};

// ─── Hashtags ─────────────────────────────────────────────────────────────────
export const MOCK_HASHTAGS: HashtagItem[] = [
  { id: "1", tag: "Technology",  postCount: 34500 },
  { id: "2", tag: "Travel",      postCount: 28200 },
  { id: "3", tag: "Photography", postCount: 19800 },
  { id: "4", tag: "Fitness",     postCount: 15300 },
];

// ─── Friends ──────────────────────────────────────────────────────────────────
export const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  { id: "1", name: "Sarah Johnson", username: "sarahj", timeAgo: "4 days ago" },
  { id: "2", name: "Michael Chen",  username: "mchen",  timeAgo: "5 days ago" },
];

export const MOCK_FRIENDS: Friend[] = [
  { id: "1", name: "David Williams", username: "dwilliams" },
];

export const MOCK_SUGGESTIONS: SuggestedUser[] = [
  { id: "1", name: "Alex Turner",  label: "Suggested for you" },
  { id: "2", name: "Emma Davis",   label: "Suggested for you" },
  { id: "3", name: "James Wilson", label: "Suggested for you" },
];

// ─── Suggested users (sidebar panel) ─────────────────────────────────────────
export const MOCK_SUGGESTED_SIDEBAR: SuggestedUser[] = [
  { id: "1", name: "Alex Turner" },
  { id: "2", name: "Emma Davis"  },
  { id: "3", name: "James Wilson"},
];

// ─── Sample post ──────────────────────────────────────────────────────────────
export const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: { id: "u1", name: "Sarah Johnson" },
    content: "Just got back from an amazing trip to the mountains! 🏔 #travel #nature",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    likes: 234, shares: 50, commentsCount: 12,
    createdAt: "5 days ago", isLiked: false, isSaved: false,
  },
  {
    id: "2",
    author: { id: "u2", name: "Michael Chen" },
    content: "Great coffee and even better code this morning ☕ #dev #coding",
    likes: 89, shares: 12, commentsCount: 5,
    createdAt: "2 days ago", isLiked: true, isSaved: false,
  },
]

// ─── Explore ──────────────────────────────────────────────────────────────────
export const EXPLORE_CATEGORIES = [
  { label: "Travel",      color: "#b0c4de", badgeColor: "#1d4ed8", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  { label: "Technology",  color: "#2d3748", badgeColor: "#2563eb", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80" },
  { label: "Fitness",     color: "#1a202c", badgeColor: "#7c3aed", imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80" },
  { label: "Food",        color: "#92400e", badgeColor: "#d97706", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" },
  { label: "Fashion",     color: "#78716c", badgeColor: "#f59e0b", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
  { label: "Nature",      color: "#365314", badgeColor: "#16a34a", imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80" },
];

export const EXPLORE_HASHTAGS = [
  { tag: "#Technology",  postCount: "34.5k posts", color: "#dbeafe" },
  { tag: "#Travel",      postCount: "28.2k posts", color: "#d1fae5" },
  { tag: "#Photography", postCount: "19.8k posts", color: "#fce7f3" },
  { tag: "#Fitness",     postCount: "15.3k posts", color: "#fef3c7" },
  { tag: "#Food",        postCount: "12.1k posts", color: "#ffedd5" },
];

export const SAVED_POSTS = [
  {
    id: "1",
    author: { id:'au-1', name: "Alice Chen", avatarUrl: undefined },
    content: "Golden hour at the coast 🌅",
    imageUrl: "https://picsum.photos/seed/coast/800/500",
    likes: 142,
    commentsCount: 8,
    shares: 12,
    createdAt: "2h ago",
    isLiked: false,
    isSaved: true,
  },
  // …more saved posts
];

export const EXPLORE_REELS = [
  { title: "Mountain Sunrise", color: "#374151", thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=80" },
  { title: "Street Food Tour", color: "#78350f", thumbnailUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80" },
  { title: "Morning Workout",  color: "#1e3a5f", thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80" },
  { title: "City Lights",      color: "#1a202c", thumbnailUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80" },
  { title: "Ocean Waves",      color: "#164e63", thumbnailUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=300&q=80" },
  { title: "Forest Walk",      color: "#14532d", thumbnailUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80" },
];

// ─── Settings tabs ────────────────────────────────────────────────────────────
export const SETTINGS_NOTIF_PREFS = [
  { key: "likes",    label: "Likes",           desc: "When someone likes your post" },
  { key: "comments", label: "Comments",        desc: "When someone comments on your post" },
  { key: "mentions", label: "Mentions",        desc: "When someone mentions you" },
  { key: "friends",  label: "Friend Requests", desc: "When someone sends you a friend request" },
  { key: "shares",   label: "Shares",          desc: "When someone shares your post" },
];