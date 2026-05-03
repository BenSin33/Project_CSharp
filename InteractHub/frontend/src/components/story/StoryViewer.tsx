import { useEffect, useRef, useState, useCallback } from "react";
import type { Story } from "../../types";

interface StoryViewerProps {
  stories: Story[];
  startIndex?: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ stories, startIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number>(0);
  const [paused, setPaused] = useState(false);

  const story = stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Progress timer
  useEffect(() => {
    setProgress(0);
    pausedAtRef.current = 0;
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      if (paused) return;
      const elapsed = Date.now() - startTimeRef.current + pausedAtRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current!);
        goNext();
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, goNext, paused]);

  // Pause on hold
  const handlePointerDown = () => {
    setPaused(true);
    pausedAtRef.current += Date.now() - startTimeRef.current;
  };
  const handlePointerUp = () => {
    setPaused(false);
    startTimeRef.current = Date.now();
    pausedAtRef.current = Math.min(pausedAtRef.current, STORY_DURATION);
  };

  // Close on backdrop Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  if (!story) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .story-viewer-wrap { animation: fadeIn 0.2s ease; }
      `}</style>

      {/* Backdrop click to close */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", cursor: "pointer" }}
      />

      {/* Story card */}
      <div
        className="story-viewer-wrap"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          height: "100svh",
          maxHeight: "100svh",
          overflow: "hidden",
          borderRadius: "0",
          background: "#111",
          display: "flex",
          flexDirection: "column",
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Progress bars */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "12px 12px 0",
          display: "flex",
          gap: "4px",
          zIndex: 10,
        }}>
          {stories.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "2.5px",
                background: "rgba(255,255,255,0.35)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div style={{
                height: "100%",
                background: "#fff",
                borderRadius: "2px",
                width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
                transition: i === currentIndex ? "none" : "none",
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "28px 14px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "1.5px solid #fff",
              flexShrink: 0,
            }}>
              {story.avatarUrl
                ? <img src={story.avatarUrl} alt={story.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{
                  width: "100%", height: "100%",
                  background: "linear-gradient(135deg,#818cf8,#6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: "16px",
                }}>
                  {story.username[0].toUpperCase()}
                </div>
              }
            </div>
            <div>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {story.username}
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", margin: 0 }}>
                27 days ago
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: "18px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-label="Close story"
          >
            ✕
          </button>
        </div>

        {/* Story image */}
        <div style={{ position: "relative", width: "100%", height: "100%", flex: 1 }}>
          {story.imageUrl ? (
            <img
              src={story.imageUrl}
              alt={`${story.username}'s story`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                userSelect: "none",
              }}
              draggable={false}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: "80px", opacity: 0.3 }}>📷</span>
            </div>
          )}
        </div>

        {/* Tap zones: left = prev, right = next */}
        <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 5 }}>
          <div
            style={{ flex: 1, cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          />
          <div
            style={{ flex: 1, cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          />
        </div>
      </div>
    </div>
  );
}