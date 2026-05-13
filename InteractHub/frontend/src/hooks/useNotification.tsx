import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { Notification } from "../types";
import { notificationService } from "../services/notificationService";

const HUB_URL = "http://localhost:5073/hubs/notifications";

function mapBackendToNotification(n: any): Notification {
  const TYPE_MAP: Record<number, Notification["type"]> = {
    0: "like",
    1: "comment",
    2: "share",
    3: "message",    // Message
    4: "friend_request",
    5: "friend_accept",
    6: "mention",
    7: "mention",
    8: "mention",
  };

  const typeKey = typeof n.type === "number" ? n.type : 0;
  return {
    id: String(n.id),
    type: TYPE_MAP[typeKey] ?? "mention",
    actor: {
      name: n.actorName ?? n.actor?.name ?? "Someone",
      avatarUrl: n.actorAvatarUrl ?? n.actor?.avatarUrl,
    },
    message: n.content ?? n.message ?? "",
    timeAgo: n.createdAt
      ? (() => {
          const diff = Date.now() - new Date(n.createdAt).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 1) return "vừa xong";
          if (mins < 60) return `${mins} phút trước`;
          const hours = Math.floor(mins / 60);
          if (hours < 24) return `${hours} giờ trước`;
          const days = Math.floor(hours / 24);
          return `${days} ngày trước`;
        })()
      : "",
    isRead: !!n.isRead,
  };
}

export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const dtos = await notificationService.getNotifications(0, 30);
      setNotifications(
        dtos.map((d) => mapBackendToNotification({
          id: d.id,
          type: d.raw?.type ?? 0,
          content: d.message,
          actorName: d.actor.name,
          actorAvatarUrl: d.actor.avatarUrl,
          createdAt: d.raw?.createdAt,
          isRead: d.isRead,
        }))
      );
    } catch (err) {
      console.warn("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (token) fetchNotifications();
  }, [token, fetchNotifications]);

  // SignalR real-time connection
  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveNotification", (n: any) => {
      const mapped = mapBackendToNotification(n);
      setNotifications((prev) => [mapped, ...prev]);
    });

    connection.on("ReceiveNewPost", (post: any) => {
      window.dispatchEvent(new CustomEvent("post-created", { detail: post }));
    });

    connection.on("ReceiveNewStory", (story: any) => {
      window.dispatchEvent(new CustomEvent("story-created", { detail: story }));
    });

    connection.on("UserUpdated", (user: any) => {
      window.dispatchEvent(new CustomEvent("user-updated", { detail: user }));
    });

    connection
      .start()
      .then(() => console.log("[SignalR Notifications] Connected"))
      .catch((err: any) =>
        console.warn("[SignalR Notifications] Connection failed:", err)
      );

    connectionRef.current = connection;

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllRead();
    } catch (err) {
      console.warn("mark all read failed", err);
    }
  };

  return { notifications, isOpen, setIsOpen, unreadCount, markAllRead, loading, fetchNotifications };
}