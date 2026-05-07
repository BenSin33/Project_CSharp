import { useState, useEffect, useCallback } from "react";
import ExploreTabs from "../components/explore/ExploreTabs";
import ExploreHashtagRow from "../components/explore/ExploreHashtagRow";
import ReelPostCard from "../components/explore/ReelPostCard";
import ReelDetailModal from "../components/explore/ReelDetailModal";
import TrendingPostCard from "../components/explore/TrendingPostCard";
import PostDetailModal from "../components/explore/PostDetailModal";
import PageHeader from "../layouts/PageHeader";
import { getTrendingPosts, getReelPosts, type PostDto } from "../services/postService";
import { getAllHashtags, getHashtagColor, type HashTagDto } from "../services/HashtagService";

type Tab = "posts" | "hashtags" | "reels";

export default function ExplorePage() {
    const [tab, setTab] = useState<Tab>("posts");

    // ── Trending Posts
    const [posts, setPosts] = useState<PostDto[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsError, setPostsError] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<PostDto | null>(null);

    // ── Hashtags
    const [hashtags, setHashtags] = useState<HashTagDto[]>([]);
    const [hashtagsLoading, setHashtagsLoading] = useState(false);
    const [hashtagsError, setHashtagsError] = useState<string | null>(null);

    // ── Reels
    const [reels, setReels] = useState<PostDto[]>([]);
    const [reelsLoading, setReelsLoading] = useState(false);
    const [reelsError, setReelsError] = useState<string | null>(null);
    const [selectedReel, setSelectedReel] = useState<PostDto | null>(null);

    const fetchTrending = useCallback(async () => {
        setPostsLoading(true);
        setPostsError(null);
        try {
            const result = await getTrendingPosts(0, 6);
            setPosts(result.data);
        } catch {
            setPostsError("Không thể tải bài viết trending. Vui lòng thử lại.");
        } finally {
            setPostsLoading(false);
        }
    }, []);

    const fetchHashtags = useCallback(async () => {
        setHashtagsLoading(true);
        setHashtagsError(null);
        try {
            const result = await getAllHashtags();
            setHashtags(result);
        } catch {
            setHashtagsError("Không thể tải hashtags. Vui lòng thử lại.");
        } finally {
            setHashtagsLoading(false);
        }
    }, []);

    const fetchReels = useCallback(async () => {
        setReelsLoading(true);
        setReelsError(null);
        try {
            const result = await getReelPosts(0, 6);
            setReels(result.data);
        } catch {
            setReelsError("Không thể tải reels. Vui lòng thử lại.");
        } finally {
            setReelsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === "posts") fetchTrending();
        else if (tab === "hashtags") fetchHashtags();
        else if (tab === "reels") fetchReels();
    }, [tab, fetchTrending, fetchHashtags, fetchReels]);

    function formatPostCount(n: number): string {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M posts";
        if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K posts";
        return `${n} post${n !== 1 ? "s" : ""}`;
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Explore"
                subtitle="Discover trending posts, hashtags, and reels from the community"
            />

            <ExploreTabs active={tab} onChange={setTab} />

            {tab === "posts" && (
                <div>
                    {postsLoading && (
                        <div className="grid grid-cols-3 gap-2.5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    )}
                    {!postsLoading && postsError && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <p className="text-gray-500 text-sm">{postsError}</p>
                            <button onClick={fetchTrending} className="text-indigo-500 text-sm font-medium hover:text-indigo-600">Thử lại</button>
                        </div>
                    )}
                    {!postsLoading && !postsError && posts.length === 0 && (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-400 text-sm">Chưa có bài viết nào có hình ảnh</p>
                        </div>
                    )}
                    {!postsLoading && !postsError && posts.length > 0 && (
                        <div className="grid grid-cols-3 gap-2.5">
                            {posts.map((post) => (
                                <TrendingPostCard key={post.id} post={post} onClick={setSelectedPost} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === "hashtags" && (
                <div className="flex flex-col gap-2">
                    {hashtagsLoading && (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    )}
                    {!hashtagsLoading && hashtagsError && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <p className="text-gray-500 text-sm">{hashtagsError}</p>
                            <button onClick={fetchHashtags} className="text-indigo-500 text-sm font-medium hover:text-indigo-600">Thử lại</button>
                        </div>
                    )}
                    {!hashtagsLoading && !hashtagsError && hashtags.length === 0 && (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-400 text-sm">Hiện chưa có hashtags nào.</p>
                        </div>
                    )}
                    {!hashtagsLoading && !hashtagsError && hashtags.length > 0 && (
                        hashtags.map((h, idx) => (
                            <ExploreHashtagRow
                                key={h.id}
                                tag={`#${h.name}`}
                                postCount={formatPostCount(h.postCount)}
                                color={getHashtagColor(idx)}
                            />
                        ))
                    )}
                </div>
            )}

            {tab === "reels" && (
                <div>
                    {reelsLoading && (
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-xl bg-gray-100 animate-pulse" style={{ aspectRatio: "9/16" }} />
                            ))}
                        </div>
                    )}
                    {!reelsLoading && reelsError && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <p className="text-gray-500 text-sm">{reelsError}</p>
                            <button onClick={fetchReels} className="text-indigo-500 text-sm font-medium hover:text-indigo-600">Thử lại</button>
                        </div>
                    )}
                    {!reelsLoading && !reelsError && reels.length === 0 && (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-400 text-sm">Hiện chưa có reels nào.</p>
                        </div>
                    )}
                    {!reelsLoading && !reelsError && reels.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {reels.map((post) => (
                                <ReelPostCard key={post.id} post={post} onClick={setSelectedReel} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedPost && (
                <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
            )}
            {selectedReel && (
                <ReelDetailModal post={selectedReel} onClose={() => setSelectedReel(null)} />
            )}
        </div>
    );
}