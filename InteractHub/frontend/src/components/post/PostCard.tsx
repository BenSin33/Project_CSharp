import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Post } from "../../types";
import type { CommentItem } from "../../services/commentService";
import Avatar from "../common/Avatar";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import InteractionModal from "./InteractionModal";
import ReactionPicker, { REACTION_OPTIONS } from "./ReactionPicker";
import { likeService, LikeType } from "../../services/likeService";
import { shareService } from "../../services/shareService";

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78z"/>
  </svg>
);
const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14z"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
  </svg>
);

export type { CommentItem };

interface Props {
  post: Post;
  initialComments?: CommentItem[];
  onLike?: (id: string) => Promise<any>;
  onAddComment?: (id: string, content: string) => Promise<CommentItem | undefined>;
  onLoadComments?: (id: string) => Promise<CommentItem[]>;
  onShare?: (id: string) => Promise<any> | void;
  onSave?: (id: string) => Promise<void>;
  onDelete?: (id: string) => void;
  onPostUpdated?: (id: string, newContent: string) => void;
}

// ─── 3-dot Post Menu ──────────────────────────────────────────────────────────
function PostMenu({ postId, isOwner, onClose, onDelete, onEdit }: {
  postId: string; isOwner: boolean; onClose: () => void; onDelete: () => void; onEdit: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportType, setReportType] = useState(3);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    try {
      await api.post("/api/post/report", { postId, reason: reportReason, reportType });
      setReportSent(true);
      setTimeout(onClose, 1500);
    } catch {
      // silent
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div ref={menuRef} className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-52">
      {isOwner ? (
        <>
          <button onClick={() => { onEdit(); onClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            ✏️ Chỉnh sửa bài viết
          </button>
          <button onClick={() => { onDelete(); onClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            🗑️ Xóa bài viết
          </button>
        </>
      ) : showReport ? (
        <div className="p-3">
          {reportSent ? (
            <p className="text-sm text-green-600 font-medium">✅ Đã báo cáo thành công!</p>
          ) : (
            <>
              <p className="text-xs text-gray-600 mb-1 font-medium">Loại báo cáo:</p>
              <select 
                className="w-full border border-gray-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-200 mb-2"
                value={reportType} onChange={e => setReportType(Number(e.target.value))}
              >
                <option value={0}>Spam</option>
                <option value={1}>Nội dung không hợp lệ</option>
                <option value={2}>Quấy rối / Bạo lực</option>
                <option value={3}>Khác</option>
              </select>
              <p className="text-xs text-gray-600 mb-1 font-medium">Lý do báo cáo:</p>
              <textarea
                className="w-full border border-gray-200 rounded-lg text-xs px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                rows={3} placeholder="Nhập lý do chi tiết..."
                value={reportReason} onChange={e => setReportReason(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setShowReport(false)} className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-lg py-1 hover:bg-gray-50">Hủy</button>
                <button onClick={handleReport} disabled={!reportReason.trim() || reportLoading} className="flex-1 text-xs text-white bg-red-500 rounded-lg py-1 hover:bg-red-600 disabled:opacity-50">
                  {reportLoading ? "..." : "Gửi"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button onClick={() => setShowReport(true)} className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2">
          🚩 Báo cáo bài viết
        </button>
      )}
    </div>
  );
}

// ─── Edit Post Modal ──────────────────────────────────────────────────────────
function EditPostModal({ postId, initialContent, onClose, onSaved }: {
  postId: string; initialContent: string; onClose: () => void; onSaved: (c: string) => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.put(`/api/post/${postId}`, { Content: content });
      onSaved(content);
      onClose();
    } catch { /* silent */ } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Chỉnh sửa bài viết</h2>
        </div>
        <div className="p-5">
          <textarea className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none" rows={5} value={content} onChange={e => setContent(e.target.value)} />
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
          <button onClick={handleSave} disabled={!content.trim() || loading} className="flex-1 h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main PostCard ─────────────────────────────────────────────────────────────
export default function PostCard({ post, initialComments = [], onLike, onAddComment, onLoadComments, onShare, onSave, onDelete, onPostUpdated }: Props) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [liked, setLiked]         = useState(post.isLiked ?? false);
  const [saved, setSaved]         = useState(post.isSaved ?? false);
  const [likes, setLikes]         = useState(post.likes);
  const [shares, setShares]       = useState(post.shares);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [postContent, setPostContent] = useState(post.content);

  const [commentText, setCommentText]       = useState("");
  const [loadingLike]                       = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const [loadingSave, setLoadingSave]       = useState(false);
  const [loadingShare, setLoadingShare]     = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [shareSuccess, setShareSuccess]     = useState(false);

  const [showComments, setShowComments]       = useState(false);
  const [comments, setComments]               = useState<CommentItem[]>(initialComments);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded]   = useState(false);

  const [showMenu, setShowMenu]         = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Interaction Modal state
  const [interactionModal, setInteractionModal] = useState<{ isOpen: boolean; title: string; users: any[]; loading: boolean }>({
    isOpen: false,
    title: "",
    users: [],
    loading: false
  });

  // Reaction Picker state
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionTimeoutRef = useRef<any>(null);
  const [currentReaction, setCurrentReaction] = useState<LikeType | null>(
    post.likeSummary?.currentUserReaction !== null && post.likeSummary?.currentUserReaction !== undefined
    ? (post.likeSummary.currentUserReaction as LikeType) : (post.isLiked ? LikeType.LIKE : null)
  );

  const isOwner = !!(currentUser?.id && post.author?.id && String(currentUser.id) === String(post.author.id));

  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 3000); };

  const handleToggleComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    if (!commentsLoaded && onLoadComments) {
      setLoadingComments(true);
      try { const data = await onLoadComments(post.id); setComments(data ?? []); setCommentsLoaded(true); }
      catch { showError("Could not load comments"); }
      finally { setLoadingComments(false); }
    }
  };

  const handleLike = async (type: LikeType = LikeType.LIKE) => {
    // If clicking same reaction, toggle off (unlike)
    const isRemoving = liked && currentReaction === type;
    
    const prevLiked = liked;
    const prevReaction = currentReaction;
    const prevLikes = likes;

    setLiked(!isRemoving);
    setCurrentReaction(isRemoving ? null : type);
    setLikes(c => isRemoving ? c - 1 : (prevLiked ? c : c + 1));
    setShowReactionPicker(false);

    if (!onLike) return;
    try {
      await likeService.toggleLike({ postId: post.id, type });
    } catch {
      setLiked(prevLiked);
      setCurrentReaction(prevReaction);
      setLikes(prevLikes);
      showError("Action failed");
    }
  };

  const showLikers = async () => {
    setInteractionModal({ isOpen: true, title: "Likes", users: [], loading: true });
    try {
      const data = await likeService.getPostLikers(post.id);
      // Map from LikeDetailDto[] to UserBasicDto[]
      const users = data.map((item: any) => item.user).filter((u: any) => u !== null);
      setInteractionModal(prev => ({ ...prev, users, loading: false }));
    } catch {
      setInteractionModal(prev => ({ ...prev, loading: false }));
      showError("Could not load likers");
    }
  };

  const showSharers = async () => {
    setInteractionModal({ isOpen: true, title: "Shares", users: [], loading: true });
    try {
      const users = await shareService.getPostSharers(post.id);
      setInteractionModal(prev => ({ ...prev, users, loading: false }));
    } catch {
      setInteractionModal(prev => ({ ...prev, loading: false }));
      showError("Could not load sharers");
    }
  };

  const handleSave = async () => {
    if (loadingSave) return;
    const next = !saved; setSaved(next); setLoadingSave(true);
    try { await onSave?.(post.id); }
    catch { setSaved(!next); showError("Save failed"); }
    finally { setLoadingSave(false); }
  };

  const handleShare = async () => {
    if (loadingShare) return;
    setLoadingShare(true); setShares(c => c + 1);
    try { await onShare?.(post.id); setShareSuccess(true); setTimeout(() => setShareSuccess(false), 2000); }
    catch { setShares(c => c - 1); showError("Share failed"); }
    finally { setLoadingShare(false); }
  };

  const submitComment = async () => {
    if (!commentText.trim() || loadingComment) return;
    const text = commentText.trim(); setCommentText(""); setLoadingComment(true);
    try {
      const newComment = await onAddComment?.(post.id, text);
      setCommentsCount(c => c + 1);
      if (showComments) {
        const item: CommentItem = newComment ?? { id: Date.now().toString(), userId: "", content: text, createdAt: new Date().toISOString() };
        setComments(prev => [...prev, item]); setCommentsLoaded(true); setShowComments(true);
      }
    } catch { showError("Comment failed"); }
    finally { setLoadingComment(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try { await api.delete(`/api/post/${post.id}`); onDelete?.(post.id); }
    catch { showError("Xóa bài viết thất bại"); }
  };

  const goToAuthorProfile = () => { if (post.author?.id) navigate(`/users/${post.author.id}`); };

  return (
    <article className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-3 items-center">
          <button onClick={goToAuthorProfile} className="shrink-0 rounded-full overflow-hidden">
            <Avatar name={post.author.name} avatarUrl={post.author.avatarUrl} size={40}/>
          </button>
          <div>
            <button onClick={goToAuthorProfile} className="font-semibold text-gray-900 text-sm hover:underline block text-left">
              {post.author.name}
            </button>
            <p className="text-xs text-gray-400">{post.createdAt}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)} className="text-gray-400 hover:text-gray-600 px-2 text-lg leading-none" aria-label="more options">
            •••
          </button>
          {showMenu && (
            <PostMenu postId={post.id} isOwner={isOwner} onClose={() => setShowMenu(false)} onDelete={handleDelete} onEdit={() => { setShowMenu(false); setShowEditModal(true); }} />
          )}
        </div>
      </div>

      {postContent && <div className="px-4 pb-3 text-sm text-gray-800 leading-relaxed">{postContent}</div>}
      {post.imageUrl && <img src={post.imageUrl} alt="post" className="w-full object-cover max-h-96"/>}

      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-50">
        <button 
          onClick={showLikers}
          className="hover:underline hover:text-blue-500 transition-colors"
        >
          {likes > 0 ? `${likes} like${likes !== 1 ? "s" : ""}` : ""}
        </button>
        <button 
          onClick={showSharers}
          className="hover:underline hover:text-blue-500 transition-colors"
        >
          {shares > 0 ? `${shares} share${shares !== 1 ? "s" : ""}` : ""}
        </button>
      </div>

      <div className="flex items-center justify-between px-2 py-1 border-t border-gray-100">
        <div className="flex">
          <div 
            className="relative"
            onMouseEnter={() => {
              reactionTimeoutRef.current = setTimeout(() => setShowReactionPicker(true), 500);
            }}
            onMouseLeave={() => {
              if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
              // Small delay before hiding to allow moving mouse to picker
              setTimeout(() => {
                if (!document.querySelector(".reaction-picker:hover")) {
                  setShowReactionPicker(false);
                }
              }, 300);
            }}
          >
            <ReactionPicker 
              isVisible={showReactionPicker} 
              onSelect={handleLike} 
            />
            <button 
              onClick={() => handleLike(currentReaction ?? LikeType.LIKE)} 
              disabled={loadingLike} 
              aria-label="like"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all transform active:scale-90 ${
                liked 
                  ? REACTION_OPTIONS[currentReaction ?? 0].color 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {liked ? (
                <span className="text-lg">{REACTION_OPTIONS[currentReaction ?? 0].emoji}</span>
              ) : (
                <HeartIcon />
              )}
              <span className="hidden sm:inline">
                {liked ? REACTION_OPTIONS[currentReaction ?? 0].label : "Like"}
              </span>
            </button>
          </div>
          <button onClick={handleToggleComments} aria-label="comment"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors">
            <CommentIcon/><span className="hidden sm:inline">Comment</span>
          </button>
          <button onClick={handleShare} disabled={loadingShare} aria-label="share"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${shareSuccess ? "text-green-600 bg-green-50" : "text-gray-500 hover:text-green-500 hover:bg-green-50"}`}>
            <ShareIcon/><span className="hidden sm:inline">{shareSuccess ? "Shared!" : "Share"}</span>
          </button>
        </div>
        <button onClick={handleSave} disabled={loadingSave} aria-label="save"
          className={`p-2 rounded-lg transition-colors ${saved ? "text-indigo-500" : "text-gray-400 hover:text-indigo-400 hover:bg-indigo-50"}`}>
          <BookmarkIcon filled={saved}/>
        </button>
      </div>

      {commentsCount > 0 && (
        <button onClick={handleToggleComments} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors w-full text-left">
          <ChevronIcon up={showComments}/>
          {showComments ? "Hide comments" : `View ${commentsCount} comment${commentsCount !== 1 ? "s" : ""}`}
        </button>
      )}

      {showComments && (
        <div className="border-t border-gray-50 bg-gray-50/50">
          {loadingComments ? (
            <div className="px-4 py-3 text-sm text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 italic">No comments yet.</div>
          ) : (
            <div className="flex flex-col gap-0.5 px-3 py-2">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5 items-start py-1.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0 overflow-hidden">
                    {c.avatarUrl ? <img src={c.avatarUrl} alt={c.senderName ?? "U"} className="w-full h-full object-cover"/> : (c.senderName ?? "U")[0].toUpperCase()}
                  </div>
                  <div className="bg-white rounded-xl px-3 py-2 text-sm text-gray-800 shadow-sm flex-1">
                    {c.senderName && <span className="font-semibold text-gray-900 mr-1.5">{c.senderName}</span>}
                    {c.content}
                    <div className="text-[11px] text-gray-400 mt-0.5">{c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 items-center px-4 py-3 border-t border-gray-100">
        <input value={commentText} onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && submitComment()}
          className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
          placeholder="Write a comment..." />
        <button onClick={submitComment} disabled={!commentText.trim() || loadingComment}
          className="text-sm font-semibold text-indigo-600 disabled:text-gray-300 hover:text-indigo-700 transition-colors px-1">
          {loadingComment ? "..." : "Post"}
        </button>
      </div>

      {error && <div className="text-red-500 text-xs px-4 pb-2">{error}</div>}

      {showEditModal && (
        <EditPostModal postId={post.id} initialContent={postContent} onClose={() => setShowEditModal(false)}
          onSaved={newContent => { setPostContent(newContent); onPostUpdated?.(post.id, newContent); }} />
      )}

      <InteractionModal 
        isOpen={interactionModal.isOpen}
        title={interactionModal.title}
        users={interactionModal.users}
        loading={interactionModal.loading}
        onClose={() => setInteractionModal(prev => ({ ...prev, isOpen: false }))}
      />
    </article>
  );
}