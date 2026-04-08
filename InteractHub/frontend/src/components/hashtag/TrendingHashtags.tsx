import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HashtagItem {
  id: string;
  tag: string;       // without "#", e.g. "Technology"
  postCount: number; // raw number, will be formatted
}

interface TrendingHashtagsProps {
  hashtags?: HashtagItem[];
  onHashtagClick?: (tag: string) => void;
  isLoading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HashtagSkeleton() {
  return (
    <div className="py-3 animate-pulse">
      <div className="h-4 w-28 bg-gray-200 rounded mb-1.5" />
      <div className="h-3 w-16 bg-gray-100 rounded" />
    </div>
  );
}

// ─── TrendingHashtags ─────────────────────────────────────────────────────────

const DEFAULT_HASHTAGS: HashtagItem[] = [
  { id: "1", tag: "Technology", postCount: 34500 },
  { id: "2", tag: "Travel",     postCount: 28200 },
  { id: "3", tag: "Photography",postCount: 19800 },
  { id: "4", tag: "Fitness",    postCount: 15300 },
];

export default function TrendingHashtags({
  hashtags = DEFAULT_HASHTAGS,
  onHashtagClick,
  isLoading = false,
}: TrendingHashtagsProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 px-4 py-4 w-full max-w-[280px]">
      <h2 className="text-base font-bold text-gray-900 mb-2">Trending</h2>

      <ul className="divide-y divide-gray-100">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i}><HashtagSkeleton /></li>
            ))
          : hashtags.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onHashtagClick?.(item.tag)}
                  className="w-full text-left py-3 group"
                >
                  <p className="text-[15px] font-medium text-blue-600 group-hover:text-blue-800 transition-colors">
                    #{item.tag}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatCount(item.postCount)} posts
                  </p>
                </button>
              </li>
            ))}
      </ul>
    </section>
  );
}
