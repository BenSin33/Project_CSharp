import { useState, useRef, useEffect } from "react";
import { X, Image } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPost: (content: string, image?: File) => void;
  user?: { name: string; username: string; avatarUrl?: string };
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPost,
  user = { name: "You", username: "@yourname" },
}: Props) {
  const [content, setContent]   = useState("");
  const [image, setImage]       = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 50);
    if (!isOpen) { setContent(""); setImage(null); setPreview(null); }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handlePost = () => {
    if (!content.trim() && !image) return;
    onPost(content.trim(), image ?? undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="bg-white rounded-2xl w-full max-w-[500px] mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900">Create Post</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Share your thoughts, photos, and updates with your network
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-6 pb-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0 overflow-hidden">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              : getInitials(user.name)
            }
          </div>
          <div>
            <p className="text-[14px] font-medium text-gray-900">{user.name}</p>
            <p className="text-[12px] text-gray-500">{user.username}</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="px-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Image preview */}
        {preview && (
          <div className="relative mx-6 mt-3">
            <img src={preview} alt="preview" className="w-full max-h-48 object-cover rounded-xl" />
            <button
              onClick={() => { setImage(null); setPreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={14} color="white" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 mt-2">
          {/* Left: image upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 border border-green-200 transition-colors"
            title="Add image"
          >
            <Image size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />

          {/* Right: Cancel + Post */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-5 rounded-lg border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={!content.trim() && !image}
              className="h-9 px-5 rounded-lg bg-gray-900 text-white text-[14px] font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}