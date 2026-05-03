import { useEffect, useState } from "react";
import type { Notification } from "../types";

// Rich mock data — hiển thị khi backend không kết nối được
const FALLBACK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "like",
    actor: { name: "Sarah Johnson", avatarUrl: "https://i.pravatar.cc/150?img=47" },
    message: "liked your post",
    timeAgo: "4 days ago",
    isRead: false,
  },
  {
    id: "2",
    type: "comment",
    actor: { name: "Michael Chen", avatarUrl: "https://i.pravatar.cc/150?img=12" },
    message: "commented on your post",
    timeAgo: "4 days ago",
    isRead: false,
  },
  {
    id: "3",
    type: "friend_request",
    actor: { name: "Emma Davis", avatarUrl: "https://i.pravatar.cc/150?img=9" },
    message: "sent you a friend request",
    timeAgo: "5 days ago",
    isRead: false,
  },
  {
    id: "4",
    type: "share",
    actor: { name: "David Williams", avatarUrl: "https://i.pravatar.cc/150?img=53" },
    message: "shared your post",
    timeAgo: "5 days ago",
    isRead: true,
  },
  {
    id: "5",
    type: "mention",
    actor: { name: "Olivia Smith", avatarUrl: "https://i.pravatar.cc/150?img=21" },
    message: "mentioned you in a comment",
    timeAgo: "6 days ago",
    isRead: true,
  },
  {
    id: "6",
    type: "like",
    actor: { name: "James Wilson", avatarUrl: "https://i.pravatar.cc/150?img=33" },
    message: "liked your photo",
    timeAgo: "1 week ago",
    isRead: true,
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const api = (await import("../services/api")).default;
      const resp = await api.get(`/api/notifications?skip=0&take=20`);
      const data = resp?.data?.data ?? resp?.data ?? [];
      const mapped: Notification[] = (Array.isArray(data) ? data : []).map((n: any) => ({
        id: String(n.id),
        type: (n.type ?? "like") as any,
        actor: { name: n.actorName ?? n.actor?.name ?? "User", avatarUrl: n.actorAvatarUrl ?? n.actor?.avatarUrl },
        message: n.content ?? n.message ?? "",
        timeAgo: n.createdAt ? new Date(n.createdAt).toLocaleDateString("vi-VN") : "",
        isRead: !!n.isRead,
      }));
      // Nếu backend trả mảng rỗng → dùng mock để UI không trống
      setNotifications(mapped.length > 0 ? mapped : FALLBACK_NOTIFICATIONS);
    } catch (err) {
      console.warn("Failed to load notifications — using mock data", err);
      setNotifications(FALLBACK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    // Cập nhật UI ngay lập tức (optimistic)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const api = (await import("../services/api")).default;
      await api.put(`/api/notifications/mark-all-read`);
    } catch (err) {
      console.warn("mark all read failed", err);
    }
  };

  return { notifications, isOpen, setIsOpen, unreadCount, markAllRead, loading };
}