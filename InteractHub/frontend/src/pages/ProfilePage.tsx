import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileTabs from "../components/Profile/ProfileTabs";
import PostCard from "../components/post/PostCard";
import type { CommentItem } from "../services/commentService";
import { mapDetailToItem, addComment, getCommentsByPost } from "../services/commentService";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService";
import { getPostsByUser } from "../services/postService";
import { toggleLike, LikeType } from "../services/likeService";
import { toggleSavePost } from "../services/savedPostService";
import { shareService } from "../services/shareService";
import type { Post } from "../types";
import type { PostDto } from "../services/postService";

type UiPost = Post & { _topComments: CommentItem[] };

function toUiPost(p: PostDto): UiPost {
  return {
    id: p.id,
    author: { id: p.author.id, name: p.author.name, avatarUrl: p.author.avatarUrl },
    content: p.content,
    imageUrl: p.imageUrl,
    likes: p.likes,
    shares: p.shares,
    commentsCount: p.commentsCount,
    createdAt: new Date(p.createdAt).toLocaleString("vi-VN"),
    isLiked: p.isLiked,
    isSaved: p.isSaved,
    status: p.status,
    originalPost: p.originalPost ? toUiPost(p.originalPost) : undefined,
    _topComments: (p.topComments ?? []).map(mapDetailToItem),
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<UiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [prof, postResult] = await Promise.all([
          userService.getMyProfile(),
          getPostsByUser(user.id, 0, 20),
        ]);
        setProfile(prof);
        setPosts(postResult.data.map(toUiPost));
      } catch (err) {
        console.error("ProfilePage load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Refresh posts when a new post is created
  useEffect(() => {
    const handler = async () => {
      if (!user) return;
      const result = await getPostsByUser(user.id, 0, 20);
      setPosts(result.data.map(toUiPost));
    };
    window.addEventListener("post-created", handler);
    return () => window.removeEventListener("post-created", handler);
  }, [user]);

  const handleLike = useCallback(async (postId: string) => {
    await toggleLike({ postId, type: LikeType.LIKE });
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked } : p
    ));
  }, []);

  const handleAddComment = useCallback(async (postId: string, content: string) => {
    const result = await addComment({ postId, content });
    if (result) setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    return result;
  }, []);

  const handleLoadComments = useCallback(async (postId: string) => getCommentsByPost(postId), []);

  const handleSave = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newSaved = await toggleSavePost(postId, post.isSaved ?? false);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: newSaved } : p));
  }, [posts]);

  const handleShare = useCallback(async (postId: string) => {
    await shareService.sharePost({ postId });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares: p.shares + 1 } : p));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-gray-100 h-56 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 h-32 animate-pulse" />
      </div>
    );
  }

  const postsContent = (
    <div className="flex flex-col gap-4 p-4">
      {posts.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No posts yet.</p>
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
          />
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <ProfileHeader
        displayName={profile?.name ?? user?.name ?? ""}
        username={profile?.username ?? user?.username ?? ""}
        bio={profile?.bio}
        avatarUrl={profile?.avatarUrl ?? user?.avatarUrl}
        location={profile?.location}
        joinedAt={profile?.joinedAt ?? ""}
        followingCount={profile?.followingCount ?? 0}
        followersCount={profile?.followersCount ?? 0}
        isOwner={true}
        onEditProfile={() => navigate("/settings")}
      />
      <ProfileTabs postsContent={postsContent} />
    </div>
  );
}