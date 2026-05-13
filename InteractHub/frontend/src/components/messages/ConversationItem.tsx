import Avatar from "../common/Avatar";

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

export default function ConversationItem({ conversation: c, isActive, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 relative transition-colors ${
        isActive ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <Avatar name={c.name} avatarUrl={c.avatarUrl} size={44} />

      <div className="flex-1 min-w-0 hidden sm:block">
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