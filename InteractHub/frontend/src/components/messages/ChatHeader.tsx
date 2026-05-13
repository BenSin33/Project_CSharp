import { Phone, Video, MoreVertical } from "lucide-react";
import Avatar from "../common/Avatar";

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

export default function ChatHeader({ name, status = "Active now", avatarUrl, onCall, onVideo, onMore }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
      <Avatar name={name} avatarUrl={avatarUrl} size={40} />
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