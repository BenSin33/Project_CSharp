import { useState, useRef, useEffect } from "react";
import { Image, X } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Avatar from "../common/Avatar";
import type { User } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPost: (content: string, image?: File) => Promise<any> | void;
  user?: Pick<User, "name" | "username" | "avatarUrl">;
}

const DEFAULT_USER = { name: "You", username: "@yourname" };

export default function CreatePostModal({
  isOpen,
  onClose,
  onPost,
  user = DEFAULT_USER,
}: Props) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Focus + reset
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setContent("");
      setImage(null);
      setPreview(null);
      setLoading(false);
    }
  }, [isOpen]);

  // ESC close (fallback nếu Modal không xử lý)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    if (!content.trim() && !image) return;

    setLoading(true);
    try {
      await onPost(content.trim(), image ?? undefined);
      onClose();
    } catch {
      // có thể show toast ở ngoài
    } finally {
      setLoading(false);
    }
  };

  const canPost = content.trim().length > 0 || image !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}       
      title="Create Post"
      subtitle="Share your thoughts, photos, and updates with your network"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePost}
            disabled={!canPost || loading}
          >
            {loading ? "Posting..." : "Post"}
          </Button>
        </>
      }
    >
      {/* User */}
      <div className="flex items-center gap-3 px-6 pb-3">
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size={40} />
        <div>
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.username}</p>
        </div>
      </div>

      {/* Text */}
      <div className="px-6">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative mx-6 mt-3">
          <img src={preview} className="w-full max-h-48 object-cover rounded-xl" />
          <button
            onClick={() => {
              setImage(null);
              setPreview(null);
            }}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
          >
            <X size={14} color="white" />
          </button>
        </div>
      )}

      {/* Upload */}
      <div className="px-6 pt-3 pb-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center border rounded-lg text-green-600 hover:bg-green-50"
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
      </div>
    </Modal>
  );
}