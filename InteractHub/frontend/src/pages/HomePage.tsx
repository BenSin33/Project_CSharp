import { useEffect, useState, useCallback } from "react";
import StoryBar from "../components/story/StoryBar";
import StoryViewer from "../components/story/StoryViewer";
import CreateStoryModal from "../components/story/CreateStoryModal";
import PostCard from "../components/post/PostCard";
import type { CommentItem } from "../services/commentService";
import { mapDetailToItem, addComment, getCommentsByPost } from "../services/commentService";
import type { Post } from "../types";
import { getAllPosts } from "../services/postService";
import { toggleLike, LikeType } from "../services/likeService";
import { toggleSavePost } from "../services/savedPostService";
import { shareService } from "../services/shareService";
import { useAuth } from "../contexts/AuthContext";
import { storyService, type StoryResponseDTO } from "../services/storyService";
import { userService } from "../services/userService";
import type { Story, StoryGroup } from "../types";

function toUiPost(p: any): UiPost {
  // Handle differences between PostDto (camelCase/frontend) and SignalR broadcast (maybe different)
  // Also handle backend names like LikeCount, CommentCount, ShareCount
  const likes = p.likes ?? p.likeCount ?? p.LikeCount ?? 0;
  const shares = p.shares ?? p.shareCount ?? p.ShareCount ?? 0;
  const commentsCount = p.commentsCount ?? p.commentCount ?? p.CommentCount ?? 0;
  
  // Extract imageUrl from MediaItems if not directly present
  let imageUrl = p.imageUrl;
  if (!imageUrl && p.mediaItems && p.mediaItems.length > 0) {
    imageUrl = p.mediaItems[0].url;
  }

  return {
    id:            p.id,
    author:        { 
      id: p.author?.id ?? p.userId ?? "", 
      name: p.author?.name ?? p.authorName ?? "Unknown User", 
      avatarUrl: p.author?.avatarUrl ?? p.authorAvatarUrl 
    },
    content:       p.content ?? "",
    imageUrl:      imageUrl,
    likes:         likes,
    shares:        shares,
    commentsCount: commentsCount,
    createdAt:     p.createdAt ? new Date(p.createdAt).toLocaleString("vi-VN") : "Just now",
    isLiked:       p.isLiked ?? false,
    isSaved:       p.isSaved ?? p.isSavedByCurrentUser ?? false,
    status:        p.status,
    originalPost:  p.originalPost ? toUiPost(p.originalPost) : undefined,
    _topComments:  (p.topComments ?? []).map(mapDetailToItem),
  }
}

type UiPost = Post & { _topComments: CommentItem[] }

function Home() {
  const { isLoading: authLoading, user } = useAuth();
  const [posts, setPosts]     = useState<UiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Story state
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storyViewerOpen,  setStoryViewerOpen]  = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null);
  const [createStoryOpen, setCreateStoryOpen]   = useState(false);

  // Fetch stories từ API
  const fetchStories = useCallback(async () => {
    try {
      const raw: StoryResponseDTO[] = await storyService.getActiveStories();
      if (!raw || raw.length === 0) {
        setStoryGroups([]);
        return;
      }

      // Lấy danh sách userId duy nhất để fetch profile 1 lần mỗi người
      const uniqueUserIds = Array.from(new Set(raw.map(s => s.userId)));
      const profilesMap = new Map<string, { name: string, avatarUrl?: string }>();

      await Promise.all(uniqueUserIds.map(async (uid) => {
        try {
          const profile = await userService.getProfile(uid);
          profilesMap.set(uid, { name: profile.name, avatarUrl: profile.avatarUrl });
        } catch {
          profilesMap.set(uid, { name: uid });
        }
      }));

      const flatStories: Story[] = raw.map(s => {
        const profile = profilesMap.get(s.userId);
        return {
          id:        s.id,
          userId:    s.userId,
          username:  profile?.name || s.userId,
          avatarUrl: profile?.avatarUrl,
          imageUrl:  s.mediaUrl,
          viewed:    false,
          active:    true,
          expiresAt: s.expireAt,
          createdAt: s.createdAt,
        };
      });

      // Group stories theo userId
      const groupsMap = new Map<string, StoryGroup>();
      flatStories.forEach(s => {
        if (!groupsMap.has(s.userId)) {
          groupsMap.set(s.userId, {
            userId: s.userId,
            username: s.username,
            avatarUrl: s.avatarUrl,
            stories: []
          });
        }
        groupsMap.get(s.userId)!.stories.push(s);
      });

      setStoryGroups(Array.from(groupsMap.values()));
    } catch (err: any) {
      console.warn("[HomePage] fetchStories failed:", err?.message ?? err);
      setStoryGroups([]);
    }
  }, []);

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
    if (!authLoading) {
      fetchPosts();
      fetchStories();
    }
  }, [authLoading, fetchPosts, fetchStories]);

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

  // Refresh when a new post or story is created
  useEffect(() => {
    const postHandler = (e: any) => { 
      if (authLoading) return;
      const newPostDto = e.detail;
      if (newPostDto) {
        setPosts(prev => {
          if (prev.some(p => p.id === newPostDto.id)) return prev;
          return [toUiPost(newPostDto), ...prev];
        });
      } else {
        fetchPosts(); 
      }
    };
    
    const storyHandler = (e: any) => { 
      if (authLoading) return;
      if (e.detail) {
        // For simplicity, re-fetch stories to handle grouping logic
        fetchStories();
      } else {
        fetchStories();
      }
    };

    const userUpdateHandler = (e: any) => {
      const updatedUser = e.detail;
      if (!updatedUser) return;
      setPosts(prev => prev.map(p => 
        p.author.id === updatedUser.id 
          ? { ...p, author: { ...p.author, name: updatedUser.fullName, avatarUrl: updatedUser.avatarUrl } } 
          : p
      ));
    };

    window.addEventListener("post-created", postHandler);
    window.addEventListener("story-created", storyHandler);
    window.addEventListener("user-updated", userUpdateHandler);
    return () => {
      window.removeEventListener("post-created", postHandler);
      window.removeEventListener("story-created", storyHandler);
      window.removeEventListener("user-updated", userUpdateHandler);
    };
  }, [authLoading, fetchPosts, fetchStories]);

  const isActuallyLoading = authLoading || loading;

  return (
    <div>
      <StoryBar
        groups={storyGroups}
        currentUserAvatarUrl={user?.avatarUrl}
        onAddStory={() => setCreateStoryOpen(true)}
        onViewStory={(group) => {
          setActiveStoryGroup(group);
          setStoryViewerOpen(true);
        }}
        emptyMessage="Hiện chưa có dữ liệu story."
      />

      {storyViewerOpen && activeStoryGroup && activeStoryGroup.stories.length > 0 && (
        <StoryViewer
          stories={activeStoryGroup.stories}
          onClose={() => {
            setStoryViewerOpen(false);
            setActiveStoryGroup(null);
          }}
        />
      )}

      <CreateStoryModal
        isOpen={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
        userAvatarUrl={undefined}
        userName="You"
        onCreated={() => {
          fetchStories();
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