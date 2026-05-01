interface Conversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  unreadCount?: number;
  avatarUrl?: string;
  avatarColor?: string;
  avatarTextColor?: string;
}

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function ConversationItem({ conversation: c, isActive, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 relative transition-colors ${
        isActive ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-medium flex-shrink-0"
        style={{ background: c.avatarColor ?? "#e5e7eb", color: c.avatarTextColor ?? "#4b5563" }}
      >
        {c.avatarUrl
          ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover rounded-full" />
          : initials(c.name)
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-1 mb-0.5">
          <span className="text-[14px] font-medium text-gray-900 truncate">{c.name}</span>
          <span className="text-[11px] text-gray-400 flex-shrink-0">{c.time}</span>
        </div>
        <p className="text-[13px] text-gray-500 truncate">{c.preview}</p>
      </div>

      {!!c.unreadCount && (
        <span className="absolute right-3.5 bottom-3 min-w-[18px] h-[18px] bg-blue-600 text-white text-[11px] font-medium rounded-full flex items-center justify-center px-1.5">
          {c.unreadCount}
        </span>
      )}
    </div>
  );
}

export type { Conversation };