import { MOCK_HASHTAGS } from "../../constants/mock";
import { formatCount } from "../../utils/format";
import type { HashtagItem } from "../../types";

function HashtagSkeleton() {
  return (
    <div className="py-3 animate-pulse">
      <div className="h-4 w-28 bg-gray-200 rounded mb-1.5" />
      <div className="h-3 w-16 bg-gray-100 rounded" />
    </div>
  );
}

interface TrendingHashtagsProps {
  hashtags?:        HashtagItem[];
  onHashtagClick?:  (tag: string) => void;
  isLoading?:       boolean;
}

export default function TrendingHashtags({
  hashtags = MOCK_HASHTAGS,
  onHashtagClick,
  isLoading = false,
}: TrendingHashtagsProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 px-4 py-4 w-full max-w-[280px]">
      <h2 className="text-base font-bold text-gray-900 mb-2">Trending</h2>
      <ul className="divide-y divide-gray-100">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <li key={i}><HashtagSkeleton /></li>)
          : hashtags.map((item) => (
              <li key={item.id}>
                <button onClick={() => onHashtagClick?.(item.tag)} className="w-full text-left py-3 group">
                  <p className="text-[15px] font-medium text-blue-600 group-hover:text-blue-800 transition-colors">
                    #{item.tag}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatCount(item.postCount)} posts</p>
                </button>
              </li>
            ))}
      </ul>
    </section>
  );
}