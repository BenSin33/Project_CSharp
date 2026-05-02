import { useState } from "react";
import FriendAvatar from "./FriendAvatar";

interface Props {
  id: string;
  name: string;
  username: string;
  timeAgo: string;
  avatarUrl?: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}
export default function RequestCard({ id, name, username, timeAgo, avatarUrl, onAccept, onDecline }: Props) {
  const [status, setStatus] = useState<"idle" | "accepted" | "declined">("idle");
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3">
      <FriendAvatar name={name} avatarUrl={avatarUrl} size={52} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900">{name}</p>
        <p className="text-[13px] text-gray-500">@{username}</p>
        <p className="text-[12px] text-gray-400 mt-0.5">{timeAgo}</p>
      </div>
      {status === "idle" ? (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => { setStatus("accepted"); onAccept(id); }}
            className="h-[34px] px-4 rounded-lg bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-700 transition-colors"
          >Accept</button>
          <button
            onClick={() => { setStatus("declined"); onDecline(id); }}
            className="h-[34px] px-4 rounded-lg border border-gray-200 text-[13px] font-medium hover:bg-gray-50 transition-colors"
          >Decline</button>
        </div>
      ) : (
        <span className={`text-[13px] font-medium flex-shrink-0 ${status === "accepted" ? "text-green-600" : "text-gray-400"}`}>
          {status === "accepted" ? "Accepted" : "Declined"}
        </span>
      )}
    </div>
  );
}