import { useState, useEffect, useCallback } from "react";
import ExploreTabs from "../components/explore/ExploreTabs";
import ExploreHashtagRow from "../components/explore/ExploreHashtagRow";
import ExploreReelCard from "../components/explore/ExploreReelCard";
import TrendingPostCard from "../components/explore/TrendingPostCard";
import PostDetailModal from "../components/explore/PostDetailModal";
import PageHeader from "../layouts/PageHeader";
import { EXPLORE_HASHTAGS, EXPLORE_REELS } from "../constants/mock";
import { getTrendingPosts, type PostDto } from "../services/postService";

type Tab = "posts" | "hashtags" | "reels";

export default function ExplorePage() {
    const [tab, setTab] = useState<Tab>("posts");

    // Trending posts state
    const [posts, setPosts] = useState<PostDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<PostDto | null>(null);

    const fetchTrending = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTrendingPosts(0, 6);
            setPosts(result.data);
        } catch {
            setError("Không thể tải bài viết trending. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === "posts") {
            fetchTrending();
        }
    }, [tab, fetchTrending]);

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Explore"
                subtitle="Discover trending posts, hashtags, and reels from the community"
            />

            <ExploreTabs active={tab} onChange={setTab} />

            {tab === "posts" && (
                <div>
                    {loading && (
                        <div className="grid grid-cols-3 gap-2.5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <p className="text-gray-500 text-sm">{error}</p>
                            <button onClick={fetchTrending} className="text-indigo-500 text-sm font-medium hover:text-indigo-600">
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && posts.length === 0 && (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-400 text-sm">Chưa có bài viết nào có hình ảnh</p>
                        </div>
                    )}

                    {!loading && !error && posts.length > 0 && (
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
                    {EXPLORE_HASHTAGS.map(h => (
                        <ExploreHashtagRow key={h.tag} {...h} />
                    ))}
                </div>
            )}

            {tab === "reels" && (
                <div className="grid grid-cols-3 gap-2">
                    {EXPLORE_REELS.map(r => (
                        <ExploreReelCard key={r.title} {...r} />
                    ))}
                </div>
            )}

            {selectedPost && (
                <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
            )}
        </div>
    );
}