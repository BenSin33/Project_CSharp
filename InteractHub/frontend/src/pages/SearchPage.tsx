import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/post/PostCard";
import type { CommentItem } from "../services/commentService";
import { mapDetailToItem, addComment, getCommentsByPost } from "../services/commentService";
import type { Post } from "../types";
import type { PostDto } from "../services/postService";
import { searchPosts } from "../services/postService";
import { toggleLike, LikeType } from "../services/likeService";
import { toggleSavePost } from "../services/savedPostService";
import { userService } from "../services/userService";
import type { UserResponseDTO } from "../services/userService";

// ─── Icons ───────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────

type UiPost = Post & { _topComments: CommentItem[] }
type Tab    = "posts" | "users"

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
    isSaved:       p.isSaved,
    _topComments:  (p.topComments ?? []).map(mapDetailToItem),
  }
}

// ─── UserCard ────────────────────────────────────────────────────────────────

function UserResultCard({ user }: { user: UserResponseDTO }) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
        style={{ background: user.avatarUrl ? "transparent" : "linear-gradient(135deg,#818cf8,#6366f1)" }}
      >
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover"/>
          : <span className="text-white font-bold text-sm">{initials}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{user.fullName}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
        {user.bio && <p className="text-xs text-gray-500 mt-0.5 truncate">{user.bio}</p>}
      </div>
    </div>
  );
}

// ─── SearchPage ──────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery]       = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [posts, setPosts]       = useState<UiPost[]>([]);
  const [users, setUsers]       = useState<UserResponseDTO[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [loading, setLoading]   = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Run search ─────────────────────────────────────────────────────────

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPosts([]);
      setUsers([]);
      setPostsTotal(0);
      setUsersTotal(0);
      return;
    }

    setLoading(true);
    try {
      const [postResult, userResult] = await Promise.all([
        searchPosts(q, 0, 20),
        userService.searchUsers(q, 0, 20),
      ]);
      setPosts(postResult.data.map(toUiPost));
      setPostsTotal(postResult.total);
      setUsers(userResult.data);
      setUsersTotal(userResult.total);
    } catch (err) {
      console.warn("search failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Debounced input ─────────────────────────────────────────────────────

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setSearchParams(q ? { q } : {});
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 400);
  };

  // Run search on initial mount if query exists
  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Post interactions ────────────────────────────────────────────────────

  const handleLike = useCallback(async (postId: string) => {
    await toggleLike({ postId, type: LikeType.LIKE });
  }, []);

  const handleAddComment = useCallback(async (postId: string, content: string) => {
    return await addComment({ postId, content });
  }, []);

  const handleLoadComments = useCallback(async (postId: string) => {
    return await getCommentsByPost(postId);
  }, []);

  const handleSave = useCallback(async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const newSaved = await toggleSavePost(postId, post.isSaved ?? false);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: newSaved } : p)));
  }, [posts]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const hasQuery     = query.trim().length > 0;
  const hasResults   = posts.length > 0 || users.length > 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Search input */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-gray-400 flex">
            <SearchIcon/>
          </span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Tìm kiếm bài viết hoặc người dùng..."
            className="w-full outline-none"
            style={{
              background:   "#f3f4f6",
              border:       "1.5px solid transparent",
              borderRadius: "999px",
              padding:      "10px 16px 10px 40px",
              fontSize:     "14px",
              fontFamily:   "'DM Sans', sans-serif",
              color:        "#111827",
              transition:   "all 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.background = "#fff"
              e.target.style.border     = "1.5px solid #6366f1"
              e.target.style.boxShadow  = "0 0 0 3px rgba(99,102,241,0.12)"
            }}
            onBlur={(e) => {
              e.target.style.background = "#f3f4f6"
              e.target.style.border     = "1.5px solid transparent"
              e.target.style.boxShadow  = "none"
            }}
          />
        </div>
      </div>

      {/* Tabs — chỉ hiện khi có query */}
      {hasQuery && (
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1.5">
          {(["posts", "users"] as Tab[]).map((tab) => {
            const count = tab === "posts" ? postsTotal : usersTotal;
            const label = tab === "posts" ? "Bài viết" : "Người dùng";
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: activeTab === tab ? "#6366f1" : "transparent",
                  color:      activeTab === tab ? "#fff"    : "#6b7280",
                }}
              >
                {tab === "posts" ? <SearchIcon/> : <UserIcon/>}
                {label}
                {!loading && count > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: activeTab === tab ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                      color:      activeTab === tab ? "#fff" : "#6b7280",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
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

      {/* Empty state */}
      {!loading && hasQuery && !hasResults && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-2 text-gray-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" className="text-gray-300">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-sm font-medium">Không tìm thấy kết quả</p>
          <p className="text-xs text-gray-300">Thử từ khoá khác nhé</p>
        </div>
      )}

      {/* No query state */}
      {!loading && !hasQuery && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-2 text-gray-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" className="text-gray-300">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-sm font-medium">Nhập từ khoá để tìm kiếm</p>
          <p className="text-xs text-gray-300">Tìm bài viết theo nội dung hoặc tên người dùng</p>
        </div>
      )}

      {/* Posts results */}
      {!loading && activeTab === "posts" && posts.length > 0 && (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              initialComments={p._topComments}
              onLike={handleLike}
              onAddComment={handleAddComment}
              onLoadComments={handleLoadComments}
              onSave={handleSave}
            />
          ))}
        </div>
      )}

      {/* Users results */}
      {!loading && activeTab === "users" && users.length > 0 && (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <UserResultCard key={u.id} user={u}/>
          ))}
        </div>
      )}
    </div>
  );
}