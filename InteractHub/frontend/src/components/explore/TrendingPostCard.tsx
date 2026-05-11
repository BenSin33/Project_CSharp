import { Heart, MessageCircle } from "lucide-react";
import type { PostDto } from "../../services/postService";

interface Props {
  post: PostDto;
  onClick: (post: PostDto) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function TrendingPostCard({ post, onClick }: Props) {
  const imageUrl = post.imageUrl;
  if (!imageUrl) return null;

  return (
    <div
      className="relative rounded-xl overflow-hidden aspect-square cursor-pointer group"
      onClick={() => onClick(post)}
    >
      {/* Image with zoom on hover */}
      <img
        src={imageUrl}
        alt={post.content?.slice(0, 50) || "Post"}
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
      />

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />

      {/* Like & Comment stats — shown only on hover */}
      <div className="absolute inset-0 flex items-center justify-center gap-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1.5 text-white font-semibold text-sm drop-shadow">
          <Heart size={20} fill="white" />
          <span>{formatCount(post.likes)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white font-semibold text-sm drop-shadow">
          <MessageCircle size={20} fill="white" />
          <span>{formatCount(post.commentsCount)}</span>
        </div>
      </div>

      {/* Hashtags badge (bottom left) — only if post has hashtags */}
      {post.hashTags && post.hashTags.length > 0 && (
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-1rem)]">
          {post.hashTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[120px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}