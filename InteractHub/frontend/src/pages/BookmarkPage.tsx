import { useEffect, useState, useCallback } from "react";
import PageHeader from "../layouts/PageHeader";
import PostCard from "../components/post/PostCard";
import type { CommentItem } from "../services/commentService";
import { mapDetailToItem, addComment, getCommentsByPost } from "../services/commentService";
import type { Post } from "../types";
import type { PostDto } from "../services/postService";
import { getSavedPosts, unsavePost } from "../services/savedPostService";
import { toggleLike, LikeType } from "../services/likeService";

// ─── Mapper ──────────────────────────────────────────────────────────────────

type UiPost = Post & { _topComments: CommentItem[] }

function toUiPost(p: PostDto): UiPost {
  return {
    id:            p.id,
    author: {
      id:        p.author.id,
      name:      p.author.name,
      avatarUrl: p.author.avatarUrl,
    },
    content:       p.content,
    imageUrl:      p.imageUrl,
    likes:         p.likes,
    shares:        p.shares,
    commentsCount: p.commentsCount,
    createdAt:     new Date(p.createdAt).toLocaleString("vi-VN"),
    isLiked:       p.isLiked,
    isSaved:       true,   // All posts here are saved by definition
    _topComments:  (p.topComments ?? []).map(mapDetailToItem),
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

function BookMarkPage() {
  const [posts, setPosts]     = useState<UiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [view, setView]       = useState<"grid" | "list">("list");

  useEffect(() => {
    (async () => {
      try {
        const result = await getSavedPosts(0, 50);
        setPosts(result.data.map(toUiPost));
        setTotal(result.total);
      } catch (err) {
        console.warn("getSavedPosts failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Like ─────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async (postId: string) => {
    await toggleLike({ postId, type: LikeType.LIKE });
  }, []);

  // ─── Comments ─────────────────────────────────────────────────────────────
  const handleAddComment = useCallback(async (postId: string, content: string) => {
    return await addComment({ postId, content });
  }, []);

  const handleLoadComments = useCallback(async (postId: string) => {
    return await getCommentsByPost(postId);
  }, []);

  // ─── Unsave (remove from bookmark) ───────────────────────────────────────
  const handleSave = useCallback(async (postId: string) => {
    // In bookmark page, clicking save again = unsave → remove from list
    await unsavePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Bookmarks"
        subtitle={loading ? "Loading..." : `${total} saved post${total !== 1 ? "s" : ""}`}
        viewToggle={{ view, onChange: setView }}
      />

      {loading && (
        <div className="flex flex-col gap-4 p-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200"/>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-32 mb-2"/>
                  <div className="h-2 bg-gray-100 rounded w-20"/>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"/>
              <div className="h-4 bg-gray-100 rounded w-1/2"/>
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" className="mb-3 text-gray-300">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-sm">Chưa có bài viết nào được lưu.</p>
          <p className="text-xs mt-1 text-gray-300">Nhấn bookmark trên bài viết để lưu lại.</p>
        </div>
      )}

      {!loading && view === "list" && posts.length > 0 && (
        <div className="flex flex-col gap-4 p-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              initialComments={post._topComments}
              onLike={handleLike}
              onAddComment={handleAddComment}
              onLoadComments={handleLoadComments}
              onSave={handleSave}
            />
          ))}
        </div>
      )}

      {!loading && view === "grid" && posts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 p-4">
          {posts.map((post) =>
            post.imageUrl ? (
              <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={post.imageUrl} alt="saved post" className="w-full h-full object-cover"/>
              </div>
            ) : (
              <div key={post.id}
                className="aspect-square rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-3 flex items-end">
                <p className="text-xs text-gray-600 line-clamp-4">{post.content}</p>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

export default BookMarkPage;
