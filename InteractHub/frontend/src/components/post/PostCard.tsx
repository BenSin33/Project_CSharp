import { useState } from "react";
import type { Post } from "../../types";
import Avatar from "../common/Avatar";

// ─── Icons ─────────────────────────────────────

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78z"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13"/>
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10z"/>
  </svg>
);

// ─── Action Button ─────────────────────────────

function ActionButton({
  icon, active, onClick, ariaLabel
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`px-3 py-1.5 rounded-md text-sm ${
        active ? "text-red-500" : "text-gray-500"
      }`}
    >
      {icon}
    </button>
  );
}

// ─── Main Component ────────────────────────────

interface Props {
  post: Post;
  onLike?: (id: string) => Promise<any>;
  onAddComment?: (id: string, content: string) => Promise<any>;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onSave?: (id: string) => void;
  onMoreOptions?: (id: string) => void;
}

export default function PostCard({
  post,
  onLike,
  onAddComment,
  onComment,
  onShare,
  onSave,
  onMoreOptions,
}: Props) {
  // state
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [saved, setSaved] = useState(post.isSaved ?? false);
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.commentsCount);

  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // ─── Like (optimistic) ───────────────────────

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((c) => (next ? c + 1 : c - 1));

    if (!onLike) return;

    setLoadingLike(true);
    try {
      await onLike(post.id);
    } catch (e: any) {
      // rollback
      setLiked(!next);
      setLikes((c) => (next ? c - 1 : c + 1));
      showError("Like failed");
    } finally {
      setLoadingLike(false);
    }
  };

  // ─── Comment (optimistic) ────────────────────

  const submitComment = async () => {
    if (!commentText.trim() || loadingComment) return;

    setComments((c) => c + 1);
    setLoadingComment(true);

    try {
      await onAddComment?.(post.id, commentText.trim());
      setCommentText("");
    } catch {
      setComments((c) => c - 1);
      showError("Comment failed");
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <article className="bg-white border rounded-xl shadow-sm">

      {/* Header */}
      <div className="flex justify-between p-4">
        <div className="flex gap-3">
          <Avatar name={post.author.name} avatarUrl={post.author.avatarUrl} size={40}/>
          <div>
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-xs text-gray-400">{post.createdAt}</p>
          </div>
        </div>
        <button onClick={() => onMoreOptions?.(post.id)}>...</button>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} className="w-full" />
      )}

      {/* Actions */}
      <div className="flex justify-between px-3 py-2">
        <div className="flex gap-2">
          <ActionButton
            icon={loadingLike ? "..." : <HeartIcon filled={liked} />}
            active={liked}
            onClick={handleLike}
            ariaLabel="like"
          />
          <ActionButton icon={<CommentIcon />} onClick={() => onComment?.(post.id)} ariaLabel="comment"/>
          <ActionButton icon={<ShareIcon />} onClick={() => onShare?.(post.id)} ariaLabel="share"/>
        </div>

        <button onClick={() => { setSaved(!saved); onSave?.(post.id); }}>
          <BookmarkIcon filled={saved}/>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 text-sm font-semibold">
        {likes} likes · {post.shares} shares
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <b>{post.author.name}</b> {post.content}
      </div>

      {/* Comments */}
      {comments > 0 && (
        <div className="px-4 text-sm text-gray-400">
          View {comments} comments
        </div>
      )}

      {/* Add comment */}
      <div className="flex gap-2 p-4 border-t">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitComment()}
          className="flex-1 outline-none"
          placeholder="Add comment..."
        />
        <button onClick={submitComment}>
          {loadingComment ? "..." : "Post"}
        </button>
      </div>

      {error && <div className="text-red-500 px-4 pb-2">{error}</div>}
    </article>
  );
}
