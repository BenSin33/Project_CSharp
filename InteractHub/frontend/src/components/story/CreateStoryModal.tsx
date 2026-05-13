import { useRef, useState, useCallback, useEffect } from "react";
import { X, Upload, ImageIcon, Film, Trash2, Loader2 } from "lucide-react";
import { storyService } from "../../services/storyService";
import { mediaService } from "../../services/mediaService";

interface CreateStoryModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  userAvatarUrl?: string;
  userName?:      string;
  onCreated?:     () => void;
}

type MediaType = "image" | "video";

export default function CreateStoryModal({
  isOpen,
  onClose,
  userAvatarUrl,
  userName = "You",
  onCreated,
}: CreateStoryModalProps) {
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [caption, setCaption]     = useState("");
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const reset = () => {
    setPreview(null);
    setFile(null);
    setCaption("");
    setError(null);
    setSuccess(false);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Auto-open file picker when modal opens for the first time
  useEffect(() => {
    if (isOpen && !preview && !file) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 300); // Small delay to ensure modal is rendered
      return () => clearTimeout(timer);
    }
  }, [isOpen, preview, file]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = useCallback((f: File) => {
    setError(null);
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setError("Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP) hoặc video (MP4, MOV, WEBM).");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 50MB.");
      return;
    }

    setMediaType(isVideo ? "video" : "image");
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleSubmit = async () => {
    if (!file && !preview) { setError("Vui lòng chọn ảnh hoặc video."); return; }
    setUploading(true);
    setError(null);
    try {
      let finalMediaUrl = preview ?? "";

      // Nếu có file local, upload lên server trước
      if (file) {
        finalMediaUrl = await mediaService.uploadFile(file);
      }

      if (!finalMediaUrl) {
        throw new Error("Không thể tải lên file.");
      }

      await storyService.createStory({
        mediaUrl:     finalMediaUrl,
        storyContent: caption.trim() || undefined,
      });
      window.dispatchEvent(new Event("story-created"));
      setSuccess(true);
      setTimeout(() => {
        reset();
        onClose();
        onCreated?.();
      }, 1200);
    } catch (err: any) {
      console.error("createStory failed:", err);
      setError(err?.message || "Đã xảy ra lỗi khi đăng story.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .story-modal { animation: modalIn 0.2s ease; }
        .drop-zone-active { border-color: #3b82f6 !important; background: #eff6ff !important; }
      `}</style>

      <div
        className="story-modal bg-white rounded-2xl w-full mx-4 overflow-hidden flex flex-col"
        style={{ maxWidth: 480, maxHeight: "90svh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* User avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              {userAvatarUrl
                ? <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)" }}>
                    {userName[0]?.toUpperCase()}
                  </div>
              }
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900 leading-tight">Create Story</h2>
              <p className="text-[12px] text-gray-400">{userName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 min-h-0">

          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-[15px] font-medium text-gray-800">Story đã được đăng!</p>
              <p className="text-[13px] text-gray-400">Story của bạn sẽ hiển thị trong 24 giờ.</p>
            </div>
          )}

          {!success && (
            <>
              {/* Drop zone / Preview */}
              {!preview ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all select-none ${dragging ? "drop-zone-active" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"}`}
                  style={{ minHeight: 240 }}
                >
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[14px] font-medium text-gray-700">Kéo thả hoặc click để chọn file</p>
                    <p className="text-[12px] text-gray-400 mt-1">Hỗ trợ ảnh (JPG, PNG, GIF, WEBP) và video (MP4, MOV, WEBM)</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">Tối đa 50MB</p>
                  </div>

                  {/* Quick type buttons */}
                  <div className="flex gap-2 mt-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                      <ImageIcon size={12} /> Ảnh
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                      <Film size={12} /> Video
                    </span>
                  </div>
                </div>
              ) : (
                /* Preview */
                <div className="relative rounded-xl overflow-hidden bg-black" style={{ maxHeight: 300 }}>
                  {mediaType === "video" ? (
                    <video
                      src={preview}
                      controls
                      className="w-full object-contain"
                      style={{ maxHeight: 300 }}
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full object-contain"
                      style={{ maxHeight: 300 }}
                    />
                  )}
                  {/* Change / remove */}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="h-7 px-2.5 rounded-lg bg-black/60 text-white text-[11px] font-medium hover:bg-black/80 transition-colors flex items-center gap-1"
                    >
                      <Upload size={11} /> Thay đổi
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="w-7 h-7 rounded-lg bg-black/60 text-white hover:bg-red-600/80 transition-colors flex items-center justify-center"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {/* Media type badge */}
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] text-white bg-black/50 rounded-full px-2 py-0.5">
                    {mediaType === "video" ? <Film size={11} /> : <ImageIcon size={11} />}
                    {mediaType === "video" ? "Video" : "Ảnh"}
                  </span>
                </div>
              )}

              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Caption */}
              <div>
                <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                  Caption <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Thêm mô tả cho story của bạn..."
                  maxLength={200}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <p className="text-[11px] text-gray-300 text-right mt-0.5">{caption.length}/200</p>
              </div>

              {/* Duration info */}
              <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3.5 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <p className="text-[12px] text-blue-600">Story sẽ tự động xoá sau <strong>24 giờ</strong></p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  <p className="text-[12px] text-red-600">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="h-9 px-4 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || !preview}
              className="h-9 px-5 rounded-xl text-[13px] font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ background: uploading || !preview ? "#9ca3af" : "#111827" }}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang đăng...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7-7 7 7"/>
                  </svg>
                  Đăng Story
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}