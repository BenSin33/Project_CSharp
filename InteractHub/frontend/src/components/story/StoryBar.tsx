import { useRef, useState } from "react";
import { MOCK_STORIES } from "../../constants/mock";
import type { Story } from "../../types";

interface StoryBarProps {
  stories?:               Story[];
  currentUserAvatarUrl?:  string;
  onAddStory?:            () => void;
  onViewStory?:           (story: Story) => void;
}

const ChevronIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function AddStoryItem({ avatarUrl, onClick }: { avatarUrl?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
      aria-label="Add your story">
      <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden"
          style={{ border: "2.5px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="Your story" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)" }} />
          }
        </div>
        <span className="absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-white"
          style={{ width: "22px", height: "22px", background: "#3b82f6", boxShadow: "0 2px 6px rgba(59,130,246,0.4)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500, color: "#374151" }}>
        Your Story
      </span>
    </button>
  );
}

function StoryItem({ story, onClick }: { story: Story; onClick?: (s: Story) => void }) {
  const [pressed, setPressed] = useState(false);
  const isActive = story.active && !story.viewed;

  const ringStyle: React.CSSProperties = isActive
    ? { background: "linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#6366f1 100%)", padding: "2.5px", borderRadius: "9999px" }
    : { background: "#d1d5db", padding: "2px", borderRadius: "9999px" };

  return (
    <button onClick={() => onClick?.(story)}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      className="flex flex-col items-center gap-2 bg-transparent border-none p-0 cursor-pointer"
      style={{ transform: pressed ? "scale(0.94)" : "scale(1)", transition: "transform 0.12s ease" }}
      aria-label={`View ${story.username}'s story`}>
      <div style={ringStyle}>
        <div style={{ background: "#fff", borderRadius: "9999px", padding: "2px" }}>
          <div className="w-14 h-14 rounded-full overflow-hidden"
            style={{ filter: story.viewed ? "grayscale(30%) brightness(0.9)" : "none", transition: "filter 0.2s" }}>
            {story.avatarUrl
              ? <img src={story.avatarUrl} alt={story.username} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "18px" }}>
                  {story.username[0].toUpperCase()}
                </div>
            }
          </div>
        </div>
      </div>
      <span style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: "12px",
        fontWeight: isActive ? 600 : 400, color: isActive ? "#111827" : "#6b7280",
        maxWidth: "72px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {story.username}
      </span>
    </button>
  );
}

export default function StoryBar({ stories = MOCK_STORIES, currentUserAvatarUrl, onAddStory, onViewStory }: StoryBarProps) {
  const scrollRef                   = useRef<HTMLDivElement>(null);
  const [canScrollLeft,  setLeft]   = useState(false);
  const [canScrollRight, setRight]  = useState(true);

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setLeft(el.scrollLeft > 4);
    setRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" });

  const arrowCls = "absolute top-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 hover:scale-105 active:scale-95";
  const arrowStyle: React.CSSProperties = { transform: "translateY(-50%)", background: "#fff", border: "1px solid #e5e7eb", color: "#374151", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div className="relative w-full"
        style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", padding: "16px 0" }}>

        {canScrollLeft  && <button onClick={() => scroll("left")}  className={`${arrowCls} left-2`}  style={arrowStyle} aria-label="Scroll left"><ChevronIcon  dir="left"  /></button>}
        {canScrollRight && <button onClick={() => scroll("right")} className={`${arrowCls} right-2`} style={arrowStyle} aria-label="Scroll right"><ChevronIcon dir="right" /></button>}

        <div ref={scrollRef} onScroll={updateScroll}
          className="flex items-start gap-5 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", padding: "4px 24px 4px" }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          <AddStoryItem avatarUrl={currentUserAvatarUrl} onClick={onAddStory} />
          {stories.map((story) => <StoryItem key={story.id} story={story} onClick={onViewStory} />)}
        </div>
      </div>
    </>
  );
}