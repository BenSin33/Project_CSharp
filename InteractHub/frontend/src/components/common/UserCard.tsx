/**
 * UserCard — component đa dụng hiển thị user theo nhiều layout:
 *  - "row"    : avatar | name + sub | action  (FriendCard, ConversationItem, SuggestionPanel item)
 *  - "tile"   : centered avatar | name + sub | action  (SuggestionCard grid)
 *  - "request": avatar | name + sub + time | accept/decline buttons  (RequestCard)
 */
import { useState } from "react";
import Avatar from "./Avatar";
import Button from "./Button";

export type UserCardLayout = "row" | "tile" | "request";

export interface UserCardAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}

export interface UserCardProps {
  name: string;
  username?: string;
  subLabel?: string;   // fallback sub-text (e.g. "Suggested for you", time ago)
  avatarUrl?: string;
  avatarColor?: string;
  avatarSize?: number;
  layout?: UserCardLayout;
  primaryAction?: UserCardAction;
  secondaryAction?: UserCardAction;
  className?: string;
}

export default function UserCard({
  name,
  username,
  subLabel,
  avatarUrl,
  avatarSize = 44,
  layout = "row",
  primaryAction,
  secondaryAction,
  className = "",
}: UserCardProps) {

  const sub = username ? `@${username}` : subLabel;

  if (layout === "tile") {
    return (
      <div className={`bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 text-center ${className}`}>
        <Avatar name={name} avatarUrl={avatarUrl} size={56} />
        <div>
          <p className="text-[14px] font-medium text-gray-900 leading-snug">{name}</p>
          {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {primaryAction && (
          <Button
            variant={primaryAction.variant ?? "secondary"}
            size="sm"
            fullWidth
            onClick={primaryAction.onClick}
            style={{ marginTop: 4, height: 32, fontSize: "12px", borderRadius: "8px" }}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    );
  }

  if (layout === "request") {
    const [status, setStatus] = useState<"idle" | "accepted" | "declined">("idle");
    return (
      <div className={`bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3 ${className}`}>
        <Avatar name={name} avatarUrl={avatarUrl} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-gray-900">{name}</p>
          {username && <p className="text-[13px] text-gray-500">@{username}</p>}
          {subLabel && <p className="text-[12px] text-gray-400 mt-0.5">{subLabel}</p>}
        </div>
        {status === "idle" ? (
          <div className="flex gap-2 flex-shrink-0">
            {primaryAction && (
              <Button variant="secondary" size="sm"
                onClick={() => { setStatus("accepted"); primaryAction.onClick(); }}>
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" size="sm"
                onClick={() => { setStatus("declined"); secondaryAction.onClick(); }}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        ) : (
          <span className={`text-[13px] font-medium flex-shrink-0 ${status === "accepted" ? "text-green-600" : "text-gray-400"}`}>
            {status === "accepted" ? "Accepted" : "Declined"}
          </span>
        )}
      </div>
    );
  }

  // layout === "row"
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 ${className}`}>
      <Avatar name={name} avatarUrl={avatarUrl} size={avatarSize} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-gray-900 truncate">{name}</p>
        {sub && <p className="text-[12px] text-gray-500">{sub}</p>}
      </div>
      {primaryAction && (
        <Button
          variant={primaryAction.variant ?? "outline"}
          size="sm"
          onClick={primaryAction.onClick}
          style={{ flexShrink: 0, width: 30, height: 30, padding: 0, borderRadius: "50%" }}
          aria-label={primaryAction.label}
        >
          {/* icon slot - cha truyền vào label, dùng ký tự đơn giản */}
          <span style={{ fontSize: 16 }}>✕</span>
        </Button>
      )}
    </div>
  );
}