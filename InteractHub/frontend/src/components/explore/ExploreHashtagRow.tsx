import { ChevronRight, Hash } from "lucide-react";

interface Props {
  tag: string;
  postCount: string;
  color?: string;
  onClick?: () => void;
}
export default function ExploreHashtagRow({ tag, postCount, color = "#dbeafe", onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-lg"
        style={{ background: color }}
      >
        <Hash size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-gray-900">{tag}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{postCount}</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
    </div>
  );
}