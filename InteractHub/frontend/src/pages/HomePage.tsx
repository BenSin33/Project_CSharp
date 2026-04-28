import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoryBar from "../components/story/StoryBar";

import PostCard from "../components/post/PostCard";
import { type Post } from "../types";
import { getAllPosts } from "../services/postService";

function Home() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        (async () => {
            try {
                // backend returns PostResponseDto; map to PostData for demo
                const data = await getAllPosts();
                const mapped = (Array.isArray(data) ? data : []).map((p: any) => ({
                    id: p.id,
                    author: { id: p.userId, name: "User" },
                    content: p.content ?? "",
                    likes: 0,
                    shares: 0,
                    commentsCount: 0,
                    createdAt: new Date(p.createdAt).toLocaleString(),
                } as Post));
                setPosts(mapped);
            } catch (err) {
                console.warn("load posts", err);
            }
        })();
    }, []);

    const handleLike = async (postId: string) => {
        try {
            const likeService = await import("../services/likeService");
            await likeService.toggleLike({ postId, type: "LIKE" });
        } catch (err) { console.warn(err); }
    };

    const handleAddComment = async (postId: string, content: string) => {
        try {
            const commentService = await import("../services/commentService");
            await commentService.addComment({ postId, content });
        } catch (err) {
            console.warn("add comment", err);
            throw err;
        }
    };

    return (
        <div>
            <StoryBar onAddStory={() => navigate("/stories/create")} onViewStory={(s) => navigate(`/stories/${s.id}`)} />
            <div className="flex flex-col gap-4">
                {posts.map(p => (
                    <PostCard key={p.id} post={p} onLike={handleLike} onAddComment={handleAddComment} />
                ))}
            </div>
        </div>
    );
}

export default Home;
