import { useEffect, useState, useRef } from "react";
import { X, Heart, MessageCircle, Share2, Send } from "lucide-react";
import Avatar from "../common/Avatar";
import type { PostDto } from "../../services/postService";
import { getCommentsByPost, addComment, type CommentItem } from "../../services/commentService";
import { toggleLike, LikeType } from "../../services/likeService";
import api from "../../services/api";

interface Props {
  post: PostDto;
  onClose: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function PostDetailModal({ post, onClose }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [shareCount, setShareCount] = useState(post.shares);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    setLoadingComments(true);
    getCommentsByPost(post.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [post.id]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    try {
      await toggleLike({ postId: post.id, type: LikeType.LIKE });
    } catch {
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : c - 1);
    }
  };

  const handleShare = async () => {
    try {
      await api.post("/api/share", { PostId: post.id });
      setShareCount(c => c + 1);
    } catch {
      // fallback: just increment optimistically
      setShareCount(c => c + 1);
    }
  };

  const handleSubmitComment = async () => {
    const text = newComment.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const added = await addComment({ postId: post.id, content: text });
      if (added) {
        setComments(prev => [...prev, added]);
        setNewComment("");
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex w-full max-w-5xl h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-colors"
        >
          <X size={20} className="text-gray-700" />
        </button>

        {/* Left: Image */}
        <div className="flex-1 bg-black flex items-center justify-center min-w-0">
          <img
            src={post.imageUrl}
            alt={post.content?.slice(0, 50) || "Post"}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Right: Info + Comments */}
        <div className="w-[380px] flex-shrink-0 flex flex-col border-l border-gray-100">

          {/* Author info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar
                name={post.author.name}
                avatarUrl={post.author.avatarUrl}
                size={42}
              />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{post.author.name}</p>
                <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
              </div>
            </div>

            {/* Post content */}
            {post.content && (
              <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-3">
                {post.content}
              </p>
            )}

            {/* Hashtags */}
            {post.hashTags && post.hashTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.hashTags.map((tag) => (
                  <span key={tag} className="text-xs text-indigo-500 font-medium">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                liked ? "text-red-500" : "text-gray-500 hover:text-red-400"
              }`}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              <span>{formatCount(likeCount)}</span>
            </button>

            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MessageCircle size={18} />
              <span>{formatCount(comments.length)}</span>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-500 transition-colors ml-auto"
            >
              <Share2 size={18} />
              <span>{formatCount(shareCount)}</span>
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {loadingComments ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Chưa có bình luận nào</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar
                    name={c.senderName || "User"}
                    avatarUrl={c.avatarUrl}
                    size={30}
                    variant="blue"
                  />
                  <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800">{c.senderName || "Người dùng"}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{c.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(c.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                placeholder="Viết bình luận..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="text-indigo-500 hover:text-indigo-600 disabled:text-gray-300 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}