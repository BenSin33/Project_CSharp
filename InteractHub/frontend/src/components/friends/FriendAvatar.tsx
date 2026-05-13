interface Props {
  name: string;
  avatarUrl?: string;
  size?: number;
}
export default function FriendAvatar({ name, avatarUrl, size = 48 }: Props) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div
      className="rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        : <span className="text-gray-500 font-medium" style={{ fontSize: size * 0.3 }}>{initials}</span>
      }
    </div>
  );
}