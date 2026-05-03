import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileTabs from "../components/Profile/ProfileTabs";
import PostCard from "../components/post/PostCard";
import type { CommentItem } from "../services/commentService";
import { mapDetailToItem, addComment, getCommentsByPost } from "../services/commentService";
import { userService } from "../services/userService";
import { getPostsByUser } from "../services/postService";
import { toggleLike, LikeType } from "../services/likeService";
import { toggleSavePost } from "../services/savedPostService";
import { shareService } from "../services/shareService";
import { friendService } from "../services/friendService";
import { useAuth } from "../contexts/AuthContext";
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
    _topComments: (p.topComments ?? []).map(mapDetailToItem),
  };
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<UiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Friendship state
  const [friendStatus, setFriendStatus] = useState<string>("none"); // none | pending | friends
  const [, setFriendshipId] = useState<string | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);

  const isOwnProfile = currentUser?.id && id && String(currentUser.id) === String(id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [prof, postResult] = await Promise.all([
          userService.getProfile(id),
          getPostsByUser(id, 0, 20),
        ]);
        setProfile(prof);
        setPosts(postResult.data.map(toUiPost));
      } catch (err) {
        console.error("UserProfilePage load error:", err);
        setError("Could not load this profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Check friendship status
  useEffect(() => {
    if (!currentUser?.id || !id || isOwnProfile) return;
    (async () => {
      try {
        // Check status via API
        const status = await friendService.checkFriendshipStatus(currentUser.id, id);
        setFriendStatus(status?.toLowerCase() ?? "none");

        // If pending or friends, try to get friendship id
        if (status?.toLowerCase() === "pending" || status?.toLowerCase() === "accepted") {
          const pending = await friendService.getPendingRequests(id);
          const found = pending.find(r => r.id === currentUser.id || r.friendshipId);
          if (found) setFriendshipId(found.friendshipId);
        }
      } catch {
        // ignore
      }
    })();
  }, [currentUser?.id, id, isOwnProfile]);

  const handleSendFriendRequest = async () => {
    if (!currentUser?.id || !id) return;
    setFriendLoading(true);
    try {
      await friendService.sendFriendRequest(currentUser.id, id);
      setFriendStatus("pending");
    } catch (err: any) {
      console.error("Send friend request error:", err);
    } finally {
      setFriendLoading(false);
    }
  };

  const handleMessage = () => {
    navigate("/messages", { state: { openUserId: id, openUserName: profile?.name } });
  };

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

  const handleDelete = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-gray-100 h-56 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 h-32 animate-pulse" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
        <p>{error ?? "User not found."}</p>
      </div>
    );
  }

  // Friend / Message action buttons
  const friendButton = !isOwnProfile && (
    <div className="flex gap-2 mt-2">
      {friendStatus === "accepted" ? (
        <span className="h-[34px] px-4 rounded-lg border border-green-200 text-[13px] font-medium text-green-700 bg-green-50 flex items-center">
          ✓ Bạn bè
        </span>
      ) : friendStatus === "pending" ? (
        <span className="h-[34px] px-4 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-500 flex items-center">
          ⏳ Đã gửi lời mời
        </span>
      ) : (
        <button
          onClick={handleSendFriendRequest}
          disabled={friendLoading}
          className="h-[34px] px-4 rounded-lg bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {friendLoading ? "..." : "➕ Kết bạn"}
        </button>
      )}
      <button
        onClick={handleMessage}
        className="h-[34px] px-4 rounded-lg border border-gray-200 text-[13px] font-medium hover:bg-gray-50 transition-colors"
      >
        💬 Nhắn tin
      </button>
    </div>
  );

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
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <ProfileHeader
        displayName={profile.name}
        username={profile.username}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        location={profile.location}
        joinedAt={profile.joinedAt ?? ""}
        followingCount={profile.followingCount ?? 0}
        followersCount={profile.followersCount ?? 0}
        isOwner={false}
        extraActions={friendButton}
      />
      <ProfileTabs postsContent={postsContent} />
    </div>
  );
}