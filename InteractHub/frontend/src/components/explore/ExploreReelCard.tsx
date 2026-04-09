import { Play } from "lucide-react";

interface Props {
  title: string;
  thumbnailUrl?: string;
  color?: string;
  onClick?: () => void;
}
export default function ExploreReelCard({ title, thumbnailUrl, color = "#1a202c", onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{ aspectRatio: "9/16" }}
    >
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full" style={{ background: color }} />
      )}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 rounded-full flex items-center justify-center">
        <Play size={11} fill="#111" strokeWidth={0} />
      </div>
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-[11px] font-medium text-white leading-tight drop-shadow">{title}</p>
      </div>
    </div>
  );
}