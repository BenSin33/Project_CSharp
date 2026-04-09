import { TrendingUp, Hash, Play } from "lucide-react";

type Tab = "posts" | "hashtags" | "reels";
interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}
const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "posts",    label: "Trending Posts", Icon: TrendingUp },
  { key: "hashtags", label: "Hashtags",       Icon: Hash },
  { key: "reels",    label: "Reels",          Icon: Play },
];
export default function ExploreTabs({ active, onChange }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-1.5 flex gap-1">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[13px] transition-colors ${
            active === key
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}