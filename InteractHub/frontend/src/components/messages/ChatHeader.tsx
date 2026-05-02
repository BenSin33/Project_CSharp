import { Phone, Video, MoreVertical } from "lucide-react";

interface Props {
  name: string;
  status?: string;
  avatarUrl?: string;
  avatarColor?: string;
  avatarTextColor?: string;
  onCall?: () => void;
  onVideo?: () => void;
  onMore?: () => void;
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function ChatHeader({ name, status = "Active now", avatarUrl, avatarColor = "#e0e7ff", avatarTextColor = "#4338ca", onCall, onVideo, onMore }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium flex-shrink-0"
        style={{ background: avatarColor, color: avatarTextColor }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          : initials(name)
        }
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-medium text-gray-900">{name}</p>
        <p className="text-[12px] text-green-600 mt-px">{status}</p>
      </div>
      <div className="flex gap-1">
        {[
          { Icon: Phone,       handler: onCall  },
          { Icon: Video,       handler: onVideo },
          { Icon: MoreVertical,handler: onMore  },
        ].map(({ Icon, handler }, i) => (
          <button
            key={i}
            onClick={handler}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Icon size={17} />
          </button>
        ))}
      </div>
    </div>
  );
}