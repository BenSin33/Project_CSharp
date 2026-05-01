import { useState } from "react";

type Tab = "posts" | "saved";

interface Props {
  postsContent?: React.ReactNode;
  savedContent?: React.ReactNode;
}

export default function ProfileTabs({ postsContent, savedContent }: Props) {
  const [active, setActive] = useState<Tab>("posts");

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mt-4">
      <div className="flex border-b border-gray-100">
        {(["posts", "saved"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] transition-colors border-b-2 -mb-px ${
              active === tab
                ? "text-gray-900 font-medium border-gray-900"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {tab === "posts" ? <GridIcon /> : <BookmarkIcon />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div>
        {active === "posts"
          ? postsContent ?? <Empty label="No posts yet" />
          : savedContent ?? <Empty label="No saved posts yet" />}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="py-12 text-center text-[14px] text-gray-400">{label}</div>
  );
}
function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  );
}