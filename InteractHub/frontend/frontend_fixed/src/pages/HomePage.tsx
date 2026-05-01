import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoryBar from "../components/story/StoryBar";
import PostCard from "../components/post/PostCard";
import { type Post } from "../types";
import { getAllPosts } from "../services/postService";
import { toggleLike, LikeType } from "../services/likeService";
import { addComment, getCommentsByPost } from "../services/commentService";

function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllPosts();
        const mapped = (Array.isArray(data) ? data : []).map((p: any) => ({
          id: p.id,
          author: { id: p.userId ?? p.author?.id ?? "", name: p.author?.name ?? "User" },
          content: p.content ?? "",
          imageUrl: p.imageUrl,
          likes: p.likes ?? 0,
          shares: p.shares ?? 0,
          commentsCount: p.commentsCount ?? 0,
          createdAt: new Date(p.createdAt).toLocaleString(),
          isLiked: p.isLiked ?? false,
          isSaved: p.isSaved ?? false,
        } as Post));
        setPosts(mapped);
      } catch (err) {
        console.warn("load posts", err);
      }
    })();
  }, []);

  // Like: gửi đúng số nguyên LikeType.LIKE = 0
  const handleLike = async (postId: string) => {
    await toggleLike({ postId, type: LikeType.LIKE });
  };

  // Comment: gọi API thực
  const handleAddComment = async (postId: string, content: string) => {
    await addComment({ postId, content });
  };

  // Load comments của một post từ API
  const handleLoadComments = async (postId: string) => {
    return await getCommentsByPost(postId);
  };

  return (
    <div>
      <StoryBar
        onAddStory={() => navigate("/stories/create")}
        onViewStory={(s) => navigate(`/stories/${s.id}`)}
      />
      <div className="flex flex-col gap-4">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onLike={handleLike}
            onAddComment={handleAddComment}
            onLoadComments={handleLoadComments}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
