import FriendAvatar from "./FriendAvatar";

interface Props {
  name: string;
  username: string;
  avatarUrl?: string;
  onUnfriend?: () => void;
}
export default function FriendCard({ name, username, avatarUrl, onUnfriend }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3">
      <FriendAvatar name={name} avatarUrl={avatarUrl} size={44} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-gray-900 truncate">{name}</p>
        <p className="text-[12px] text-gray-500">@{username}</p>
      </div>
      <button
        onClick={onUnfriend}
        title="Remove friend"
        className="w-[30px] h-[30px] rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 flex-shrink-0"
      >
        <UnfriendIcon />
      </button>
    </div>
  );
}
function UnfriendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  );
}