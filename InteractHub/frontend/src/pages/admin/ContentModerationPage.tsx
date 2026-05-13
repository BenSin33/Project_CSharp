import { useEffect, useState, useMemo } from "react"
import { Search, ShieldAlert, Trash2, EyeOff, Eye, CheckCircle, X } from "lucide-react"
import { adminService } from "../../services/adminService"
import Avatar from "../../components/common/Avatar"

interface ModalState {
  type: "hide" | "unhide" | "delete" | null
  postId: string
  postContent: string
}

export default function ContentModerationPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: null, postId: "", postContent: "" })

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await adminService.getAllPosts(0, 100)
      setPosts(data || [])
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts
    const s = searchTerm.toLowerCase()
    return posts.filter(p => 
      (p.content || "").toLowerCase().includes(s) || 
      (p.author?.name || "").toLowerCase().includes(s)
    )
  }, [posts, searchTerm])

  const openModal = (type: "hide" | "unhide" | "delete", postId: string, postContent: string) => {
    setModal({ type, postId, postContent: postContent.slice(0, 100) })
  }

  const closeModal = () => {
    setModal({ type: null, postId: "", postContent: "" })
  }

  const executeAction = async () => {
    if (!modal.type || !modal.postId) return
    setActionLoading(modal.postId)
    try {
      if (modal.type === "hide") {
        await adminService.hidePost(modal.postId, "Vi phạm quy tắc cộng đồng (Moderated by Admin)")
        setMessage({ text: "Đã ẩn bài viết thành công", type: "success" })
      } else if (modal.type === "unhide") {
        await adminService.unhidePost(modal.postId)
        setMessage({ text: "Đã hiện lại bài viết thành công", type: "success" })
      } else if (modal.type === "delete") {
        await adminService.deletePost(modal.postId, { reason: "Moderator deleted post via Content Moderation panel", adminNotes: "Xóa từ Admin" })
        setMessage({ text: "Đã xóa bài viết vĩnh viễn", type: "success" })
      }
      closeModal()
      await loadPosts()
    } catch (e: any) {
      console.error(e)
      setMessage({ text: `Lỗi: ${e?.response?.data?.message || e?.message || "Unknown error"}`, type: "error" })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-bold text-slate-900">
            <ShieldAlert className="text-blue-600" size={32} />
            Content Moderation
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">Chủ động kiểm soát và xử lý tất cả bài viết trên hệ thống</p>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm kiếm nội dung hoặc tác giả..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[14px] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <div className={`mb-6 rounded-xl p-4 text-sm font-medium flex items-center gap-2 ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        }`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500">Tác giả</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500">Nội dung bài viết</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Ngày đăng</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                      Đang tải danh sách bài viết...
                    </div>
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy bài viết nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={post.author?.name || "U"} avatarUrl={post.author?.avatarUrl} size={36} />
                        <div>
                          <div className="text-[14px] font-bold text-slate-900">{post.author?.name || "Unknown"}</div>
                          <div className="text-[12px] text-slate-500">ID: {post.author?.id?.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="line-clamp-2 text-[14px] text-slate-700">
                        {post.content || <span className="italic text-slate-400">(Không có nội dung văn bản)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {post.status?.toLowerCase() === "hidden" ? (
                        <span className="bg-orange-100 text-orange-600 text-[11px] font-bold px-2 py-0.5 rounded-full">HIDDEN</span>
                      ) : (
                        <span className="bg-green-100 text-green-600 text-[11px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] text-slate-500">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "--"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status?.toLowerCase() === "hidden" ? (
                          <button 
                            onClick={() => openModal("unhide", post.id, post.content || "")}
                            disabled={actionLoading === post.id}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                            title="Hiện lại bài viết"
                          >
                            <Eye size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => openModal("hide", post.id, post.content || "")}
                            disabled={actionLoading === post.id}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-50"
                            title="Ẩn bài viết"
                          >
                            <EyeOff size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => openModal("delete", post.id, post.content || "")}
                          disabled={actionLoading === post.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {modal.type === "hide" ? "Ẩn bài viết" : modal.type === "unhide" ? "Hiện lại bài viết" : "Xóa bài viết vĩnh viễn"}
              </h3>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="mb-2 text-[14px] text-slate-600">
              {modal.type === "hide"
                ? "Bài viết sẽ bị ẩn khỏi bảng tin công cộng. Bạn có chắc chắn?"
                : modal.type === "unhide"
                ? "Bài viết sẽ được hiển thị công khai trở lại. Bạn có chắc chắn?"
                : "CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn bài viết và không thể hoàn tác."}
            </p>
            {modal.postContent && (
              <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[13px] italic text-slate-600">
                "{modal.postContent}..."
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={executeAction}
                disabled={actionLoading !== null}
                className={`rounded-xl px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 ${
                  modal.type === "delete" ? "bg-red-600 hover:bg-red-700" : modal.type === "unhide" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {actionLoading ? "Đang xử lý..." : modal.type === "hide" ? "Xác nhận ẩn" : modal.type === "unhide" ? "Xác nhận hiện" : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
