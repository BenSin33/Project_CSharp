import { useState } from "react";
import type { Notification } from "../components/notification/NotificationPanel";

const MOCK: Notification[] = [
  { id:"1", type:"like",           actor:{ name:"Sarah Johnson"  }, message:"liked your post",              timeAgo:"4 days ago", isRead:false },
  { id:"2", type:"comment",        actor:{ name:"Michael Chen"   }, message:"commented on your post",       timeAgo:"4 days ago", isRead:false },
  { id:"3", type:"friend_request", actor:{ name:"Sarah Johnson"  }, message:"sent you a friend request",    timeAgo:"5 days ago", isRead:false },
  { id:"4", type:"share",          actor:{ name:"David Williams" }, message:"shared your post",             timeAgo:"5 days ago", isRead:true  },
  { id:"5", type:"mention",        actor:{ name:"Michael Chen"   }, message:"mentioned you in a comment",   timeAgo:"6 days ago", isRead:true  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

  return { notifications, isOpen, setIsOpen, unreadCount, markAllRead };
}