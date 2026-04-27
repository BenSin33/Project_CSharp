import { useEffect, useState } from "react";
import type { Notification } from "../components/notifications/NotificationPanel";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* NOTE (2026-04-27):
     - Hook này được cập nhật ngày 27/04/2026 để gọi backend thay vì dùng dữ liệu mock.
     - Gọi GET /api/notifications?skip=0&take=20 để load notifications.
     - Thêm PUT /api/notifications/mark-all-read để đánh dấu đã đọc.
     - Lưu ý: mapping response có fallback nhẹ nếu backend trả format khác.
  */


    // thay mock bằng gọi GET /api/notifications?skip=0&take=20 để tải notifications
    // thêm markAllRead gọi PUT /api/notifications/mark-all-read và cập nhật trạng thái cục bộ
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const api = (await import("../services/api")).default;
      const resp = await api.get(`/api/notifications?skip=0&take=20`);
      const data = resp?.data?.data ?? resp?.data ?? [];
      const mapped: Notification[] = (Array.isArray(data) ? data : []).map((n: any) => ({
        id: n.id ?? String(n.id),
        type: (n.type ?? "like") as any,
        actor: { name: "System" },
        message: n.content ?? n.message ?? "",
        timeAgo: new Date(n.createdAt ?? Date.now()).toLocaleString(),
        isRead: !!n.isRead,
      }));
      setNotifications(mapped);
    } catch (err) {
        // fallback nhẹ nếu backend trả dữ liệu khác format
      console.warn("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      const api = (await import("../services/api")).default;
      await api.put(`/api/notifications/mark-all-read`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn("mark all read failed", err);
    }
  };

  return { notifications, isOpen, setIsOpen, unreadCount, markAllRead, loading };
}
