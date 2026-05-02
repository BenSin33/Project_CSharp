import { useState } from "react";
import type { Post } from "../../types";
import type { CommentItem } from "../../services/commentService";
import Avatar from "../common/Avatar";

// ─── Icons ─────────────────────────────────────────────────────────────────────

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78z"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);

const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {up
      ? <polyline points="18 15 12 9 6 15"/>
      : <polyline points="6 9 12 15 18 9"/>
    }
  </svg>
);

// ─── Re-export CommentItem so it can be used from PostCard too ────────────────
export type { CommentItem };

interface Props {
  post: Post;
  initialComments?: CommentItem[];       // Top comments preloaded from post data
  onLike?: (id: string) => Promise<any>;
  onAddComment?: (id: string, content: string) => Promise<CommentItem | undefined>;
  onLoadComments?: (id: string) => Promise<CommentItem[]>;
  onShare?: (id: string) => void;
  onSave?: (id: string) => Promise<void>;
  onMoreOptions?: (id: string) => void;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PostCard({
  post,
  initialComments = [],
  onLike,
  onAddComment,
  onLoadComments,
  onShare,
  onSave,
  onMoreOptions,
}: Props) {
  const [liked, setLiked]         = useState(post.isLiked ?? false);
  const [saved, setSaved]         = useState(post.isSaved ?? false);
  const [likes, setLikes]         = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

  const [commentText, setCommentText]     = useState("");
  const [loadingLike, setLoadingLike]     = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const [loadingSave, setLoadingSave]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ─── Comment expand state — seeded with initialComments ───────────────────
  const [showComments, setShowComments]       = useState(false);
  const [comments, setComments]               = useState<CommentItem[]>(initialComments);
  const [loadingComments, setLoadingComments] = useState(false);
  // Always fetch full comment list from API on first open (initialComments chỉ là top 5 preview)
  const [commentsLoaded, setCommentsLoaded]   = useState(false);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // ─── Toggle comment list ───────────────────────────────────────────────────

  const handleToggleComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setShowComments(true);

    // Load đầy đủ từ API nếu chưa có (hoặc chỉ có top 5 từ post)
    if (!commentsLoaded && onLoadComments) {
      setLoadingComments(true);
      try {
        const data = await onLoadComments(post.id);
        setComments(data ?? []);
        setCommentsLoaded(true);
      } catch {
        showError("Could not load comments");
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // ─── Like (optimistic) ────────────────────────────────────────────────────

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((c) => (next ? c + 1 : c - 1));

    if (!onLike) return;
    setLoadingLike(true);
    try {
      await onLike(post.id);
    } catch {
      setLiked(!next);
      setLikes((c) => (next ? c - 1 : c + 1));
      showError("Like failed");
    } finally {
      setLoadingLike(false);
    }
  };

  // ─── Save (optimistic) ────────────────────────────────────────────────────

  const handleSave = async () => {
    if (loadingSave) return;
    const next = !saved;
    setSaved(next);
    setLoadingSave(true);
    try {
      await onSave?.(post.id);
    } catch {
      setSaved(!next);
      showError("Save failed");
    } finally {
      setLoadingSave(false);
    }
  };

  // ─── Add comment ──────────────────────────────────────────────────────────

  const submitComment = async () => {
    if (!commentText.trim() || loadingComment) return;
    const text = commentText.trim();
    setCommentText("");
    setLoadingComment(true);

    try {
      const newComment = await onAddComment?.(post.id, text);
      setCommentsCount((c) => c + 1);
      if (showComments) {
        const item: CommentItem = newComment ?? {
          id:        Date.now().toString(),
          userId:    "",
          content:   text,
          createdAt: new Date().toISOString(),
        };
        setComments((prev) => [...prev, item]);
        setCommentsLoaded(true);
        setShowComments(true);
      }
    } catch {
      showError("Comment failed");
    } finally {
      setLoadingComment(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <article className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-3 items-center">
          <Avatar name={post.author.name} avatarUrl={post.author.avatarUrl} size={40}/>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{post.author.name}</p>
            <p className="text-xs text-gray-400">{post.createdAt}</p>
          </div>
        </div>
        <button
          onClick={() => onMoreOptions?.(post.id)}
          className="text-gray-400 hover:text-gray-600 px-2"
          aria-label="more options"
        >•••</button>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3 text-sm text-gray-800 leading-relaxed">
          {post.content}
        </div>
      )}

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="post" className="w-full object-cover max-h-96"/>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-50">
        <span>{likes > 0 ? `${likes} like${likes !== 1 ? "s" : ""}` : ""}</span>
        <span>{post.shares > 0 ? `${post.shares} share${post.shares !== 1 ? "s" : ""}` : ""}</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between px-2 py-1 border-t border-gray-100">
        <div className="flex">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={loadingLike}
            aria-label="like"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              liked ? "text-red-500" : "text-gray-500 hover:text-red-400 hover:bg-red-50"
            }`}
          >
            <HeartIcon filled={liked}/>
            <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
          </button>

          {/* Comment */}
          <button
            onClick={handleToggleComments}
            aria-label="comment"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <CommentIcon/>
            <span className="hidden sm:inline">Comment</span>
          </button>

          {/* Share */}
          <button
            onClick={() => onShare?.(post.id)}
            aria-label="share"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors"
          >
            <ShareIcon/>
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Save / Bookmark */}
        <button
          onClick={handleSave}
          disabled={loadingSave}
          aria-label="save"
          className={`p-2 rounded-lg transition-colors ${
            saved ? "text-indigo-500" : "text-gray-400 hover:text-indigo-400 hover:bg-indigo-50"
          }`}
        >
          <BookmarkIcon filled={saved}/>
        </button>
      </div>

      {/* View comments toggle */}
      {commentsCount > 0 && (
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors w-full text-left"
        >
          <ChevronIcon up={showComments}/>
          {showComments
            ? "Hide comments"
            : `View ${commentsCount} comment${commentsCount !== 1 ? "s" : ""}`}
        </button>
      )}

      {/* Comments list */}
      {showComments && (
        <div className="border-t border-gray-50 bg-gray-50/50">
          {loadingComments ? (
            <div className="px-4 py-3 text-sm text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 italic">No comments yet.</div>
          ) : (
            <div className="flex flex-col gap-0.5 px-3 py-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5 items-start py-1.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0 overflow-hidden">
                    {c.avatarUrl
                      ? <img src={c.avatarUrl} alt={c.senderName ?? "U"} className="w-full h-full object-cover"/>
                      : (c.senderName ?? "U")[0].toUpperCase()
                    }
                  </div>
                  <div className="bg-white rounded-xl px-3 py-2 text-sm text-gray-800 shadow-sm flex-1">
                    {c.senderName && (
                      <span className="font-semibold text-gray-900 mr-1.5">{c.senderName}</span>
                    )}
                    {c.content}
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add comment input */}
      <div className="flex gap-2 items-center px-4 py-3 border-t border-gray-100">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
          className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
          placeholder="Write a comment..."
        />
        <button
          onClick={submitComment}
          disabled={!commentText.trim() || loadingComment}
          className="text-sm font-semibold text-indigo-600 disabled:text-gray-300 hover:text-indigo-700 transition-colors px-1"
        >
          {loadingComment ? "..." : "Post"}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-xs px-4 pb-2">{error}</div>
      )}
    </article>
  );
}