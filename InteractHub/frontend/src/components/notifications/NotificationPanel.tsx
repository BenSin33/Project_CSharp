import { useEffect, useRef } from "react";
import { X, Heart, MessageCircle, UserPlus, Share2, AtSign, UserCheck, Mail } from "lucide-react";
import Avatar from "../common/Avatar";
import type { Notification, NotifType } from "../../types";

interface NotificationPanelProps {
  isOpen:        boolean;
  onClose:       () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

const TYPE_CONFIG: Record<NotifType, { Icon: React.ElementType; color: string; bg: string }> = {
  like:           { Icon: Heart,          color: "#e11d48", bg: "#fff1f2" },
  comment:        { Icon: MessageCircle,  color: "#2563eb", bg: "#eff6ff" },
  friend_request: { Icon: UserPlus,       color: "#16a34a", bg: "#f0fdf4" },
  friend_accept:  { Icon: UserCheck,      color: "#0891b2", bg: "#ecfeff" },
  share:          { Icon: Share2,         color: "#7c3aed", bg: "#f5f3ff" },
  mention:        { Icon: AtSign,         color: "#ea580c", bg: "#fff7ed" },
  message:        { Icon: Mail,           color: "#6366f1", bg: "#eef2ff" },
};

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/20">
      <div ref={panelRef} className="absolute top-0 right-0 h-full w-[340px] bg-white border-l border-gray-100 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[18px] font-semibold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-3">
            <button onClick={onMarkAllRead} className="text-[12px] text-gray-500 hover:text-gray-800 transition-colors">
              Mark all as read
            </button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-[14px]">No notifications yet</span>
            </div>
          ) : (
            notifications.map((n) => {
              const { Icon, color, bg } = TYPE_CONFIG[n.type];
              return (
                <div key={n.id}
                  className={`flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 cursor-pointer transition-colors ${
                    n.isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50/60 hover:bg-blue-50"
                  }`}>
                  {/* Avatar + type badge */}
                  <div className="relative flex-shrink-0">
                    <Avatar name={n.actor.name} avatarUrl={n.actor.avatarUrl} size={40} variant="gray" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: bg, border: "1.5px solid white" }}>
                      <Icon size={10} color={color} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-900 leading-snug">
                      <span className="font-medium">{n.actor.name}</span>{" "}{n.message}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-1">{n.timeAgo}</p>
                  </div>

                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}