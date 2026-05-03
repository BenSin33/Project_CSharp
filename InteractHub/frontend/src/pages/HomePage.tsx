import { useEffect, useState, useCallback } from "react";
import StoryBar from "../components/story/StoryBar";
import StoryViewer from "../components/story/StoryViewer";
import CreateStoryModal from "../components/story/CreateStoryModal";
import PostCard from "../components/post/PostCard";
import type { CommentItem } from "../services/commentService";
import { mapDetailToItem, addComment, getCommentsByPost } from "../services/commentService";
import type { Post } from "../types";
import type { PostDto } from "../services/postService";
import { getAllPosts } from "../services/postService";
import { toggleLike, LikeType } from "../services/likeService";
import { toggleSavePost } from "../services/savedPostService";
import { shareService } from "../services/shareService";
import { useAuth } from "../contexts/AuthContext";
import { MOCK_STORIES } from "../constants/mock";

function toUiPost(p: PostDto): Post & { _topComments: CommentItem[] } {
  return {
    id:            p.id,
    author:        { id: p.author.id, name: p.author.name, avatarUrl: p.author.avatarUrl },
    content:       p.content,
    imageUrl:      p.imageUrl,
    likes:         p.likes,
    shares:        p.shares,
    commentsCount: p.commentsCount,
    createdAt:     new Date(p.createdAt).toLocaleString("vi-VN"),
    isLiked:       p.isLiked,
    isSaved:       p.isSaved,
    _topComments:  (p.topComments ?? []).map(mapDetailToItem),
  }
}

type UiPost = Post & { _topComments: CommentItem[] }

function Home() {
  const { isLoading: authLoading } = useAuth();
  const [posts, setPosts]     = useState<UiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Story viewer state
  const [storyViewerOpen,  setStoryViewerOpen]  = useState(false);
  const [storyStartIndex,  setStoryStartIndex]  = useState(0);
  // Create story modal
  const [createStoryOpen, setCreateStoryOpen]   = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllPosts(0, 20);
      setPosts((Array.isArray(result.data) ? result.data : []).map(toUiPost));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (status === 403) {
        setError("Bạn không có quyền xem bài viết này.");
      } else if (err?.code === "ERR_NETWORK" || !status) {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.");
      } else {
        setError(`Không thể tải bài viết (lỗi ${status ?? "unknown"}). Vui lòng thử lại.`);
      }
      console.error("[HomePage] fetchPosts failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chờ auth restore xong mới fetch
  useEffect(() => {
    if (!authLoading) fetchPosts();
  }, [authLoading, fetchPosts]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      await toggleLike({ postId, type: LikeType.LIKE });
      // Cập nhật UI lạc quan
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked }
          : p
      ));
    } catch (err) {
      console.error("[HomePage] toggleLike failed:", err);
    }
  }, []);

  const handleAddComment = useCallback(async (postId: string, content: string) => {
    const result = await addComment({ postId, content });
    if (result) {
      // Tăng commentCount trong UI
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ));
    }
    return result;
  }, []);

  const handleLoadComments = useCallback(async (postId: string) => {
    return await getCommentsByPost(postId);
  }, []);

  const handleSave = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    try {
      const newSaved = await toggleSavePost(postId, post.isSaved ?? false);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: newSaved } : p));
    } catch (err) {
      console.error("[HomePage] toggleSave failed:", err);
    }
  }, [posts]);

  const handleShare = useCallback(async (postId: string) => {
    try {
      await shareService.sharePost({ postId });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares: p.shares + 1 } : p));
    } catch (err) {
      console.error("[HomePage] share failed:", err);
    }
  }, []);

  const handleDelete = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // Refresh when a new post is created
  useEffect(() => {
    const handler = () => { if (!authLoading) fetchPosts(); };
    window.addEventListener("post-created", handler);
    return () => window.removeEventListener("post-created", handler);
  }, [authLoading, fetchPosts]);

  const isActuallyLoading = authLoading || loading;

  return (
    <div>
      <StoryBar
        stories={MOCK_STORIES}
        onAddStory={() => setCreateStoryOpen(true)}
        onViewStory={(s) => {
          const idx = MOCK_STORIES.findIndex(ms => ms.id === s.id);
          setStoryStartIndex(idx >= 0 ? idx : 0);
          setStoryViewerOpen(true);
        }}
      />

      {storyViewerOpen && (
        <StoryViewer
          stories={MOCK_STORIES}
          startIndex={storyStartIndex}
          onClose={() => setStoryViewerOpen(false)}
        />
      )}

      <CreateStoryModal
        isOpen={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
        userAvatarUrl={undefined}
        userName="You"
        onCreated={() => {
          // Có thể refresh story bar ở đây nếu cần
          console.log("Story created!");
        }}
      />

      {isActuallyLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
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

      {!isActuallyLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            onClick={fetchPosts}
            className="shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 text-xs font-semibold transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isActuallyLoading && !error && (
        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
              <p className="text-base">Chưa có bài viết nào.</p>
            </div>
          ) : (
            posts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                initialComments={p._topComments}
                onLike={handleLike}
                onAddComment={handleAddComment}
                onLoadComments={handleLoadComments}
                onSave={handleSave}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home;