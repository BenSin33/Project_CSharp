import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface PostData {
  id: string;
  author: PostAuthor;
  content: string;
  imageUrl?: string;
  likes: number;
  shares: number;
  commentsCount: number;
  createdAt: string; // e.g. "5 days ago"
  isLiked?: boolean;
  isSaved?: boolean;
}

interface PostCardProps {
  post: PostData;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onMoreOptions?: (postId: string) => void;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ author }: { author: PostAuthor }) {
  const initials = author.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-blue-500 flex items-center justify-center text-white text-sm font-semibold select-none">
      {author.avatarUrl ? (
        <img
          src={author.avatarUrl}
          alt={author.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}

function ActionButton({ icon, label, active, onClick, ariaLabel }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
        ${
          active
            ? "text-red-500 hover:bg-red-50"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

// ─── Icons (inline SVG, no external deps) ─────────────────────────────────────

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const DotsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

// ─── PostCard ─────────────────────────────────────────────────────────────────

export default function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onMoreOptions,
}: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    onLike?.(post.id);
  };

  const handleSave = () => {
    setSaved((s) => !s);
    onSave?.(post.id);
  };

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-[500px] w-full shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar author={post.author} />
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {post.author.name}
            </p>
            <p className="text-gray-400 text-xs">{post.createdAt}</p>
          </div>
        </div>
        <button
          onClick={() => onMoreOptions?.(post.id)}
          aria-label="More options"
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
        >
          <DotsIcon />
        </button>
      </div>

      {/* ── Image ── */}
      {post.imageUrl && (
        <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── Action row ── */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex items-center gap-0.5">
          <ActionButton
            icon={<HeartIcon filled={liked} />}
            active={liked}
            onClick={handleLike}
            ariaLabel="Like post"
          />
          <ActionButton
            icon={<CommentIcon />}
            onClick={() => onComment?.(post.id)}
            ariaLabel="Comment on post"
          />
          <ActionButton
            icon={<ShareIcon />}
            onClick={() => onShare?.(post.id)}
            ariaLabel="Share post"
          />
        </div>
        <button
          onClick={handleSave}
          aria-label="Save post"
          className={`p-1.5 rounded-md transition-colors
            ${saved ? "text-gray-900 hover:bg-gray-100" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="px-4 pb-1">
        <p className="text-sm font-semibold text-gray-900">
          {likeCount.toLocaleString()} likes
          <span className="font-normal text-gray-500 ml-2">
            · {post.shares.toLocaleString()} shares
          </span>
        </p>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-2">
        <p className="text-sm text-gray-800 leading-relaxed">
          <span className="font-semibold text-gray-900 mr-1">{post.author.name}</span>
          {post.content}
        </p>
      </div>

      {/* ── View comments ── */}
      {post.commentsCount > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={() => onComment?.(post.id)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            View all {post.commentsCount} comments
          </button>
        </div>
      )}

      {/* ── Add comment ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter") onComment?.(post.id);
          }}
        />
        <button className="text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors">
          Post
        </button>
      </div>
    </article>
  );
}

// ─── Usage example ────────────────────────────────────────────────────────────
type DemoProps = {
  isLiked?: boolean;
  isSaved?: boolean;
};

export function PostCardDemo({ isLiked = false, isSaved = false }: DemoProps) {
  const samplePost: PostData = {
    id: "1",
    author: {
      id: "u1",
      name: "Sarah Johnson",
      avatarUrl: undefined,
    },
    content:
      "Just got back from an amazing trip to the mountains! The views were absolutely breathtaking. Can't wait to share more photos soon! 🏔 #travel #nature",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    likes: 234,
    shares: 50,
    commentsCount: 2,
    createdAt: "5 days ago",
    isLiked,
    isSaved,
  };

  return (
    <div className="flex justify-center p-8 bg-gray-50 min-h-screen">
      <PostCard
        post={samplePost}
        onLike={(id) => console.log("Liked:", id)}
        onComment={(id) => console.log("Comment:", id)}
        onShare={(id) => console.log("Shared:", id)}
        onSave={(id) => console.log("Saved:", id)}
        onMoreOptions={(id) => console.log("More options:", id)}
      />
    </div>
  );
}
