import { Heart, MessageCircle, Play } from "lucide-react";
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

export default function ReelPostCard({ post, onClick }: Props) {
  const videoUrl = post.imageUrl; // imageUrl stores first media URL (video in this case)
  if (!videoUrl) return null;

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{ aspectRatio: "9/16" }}
      onClick={() => onClick(post)}
    >
      {/* Video thumbnail via video element (muted, no controls) */}
      <video
        src={videoUrl}
        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        muted
        playsInline
        preload="metadata"
      />

      {/* Play icon overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300">
        <Play size={14} fill="#111" strokeWidth={0} className="ml-0.5" />
      </div>

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />

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

      {/* Author + title at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
        <p className="text-white text-[11px] font-medium truncate drop-shadow">
          {post.author.name}
        </p>
        {post.content && (
          <p className="text-white/80 text-[10px] truncate mt-0.5 leading-tight">
            {post.content.slice(0, 60)}
          </p>
        )}
      </div>
    </div>
  );
}