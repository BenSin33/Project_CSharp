import { useEffect, useState, useMemo } from "react"
import { Search, ShieldAlert, Trash2, EyeOff, CheckCircle, ExternalLink } from "lucide-react"
import { getAllPosts, deletePost, type PostDto } from "../../services/postService"
import { adminService } from "../../services/adminService"
import Avatar from "../../components/common/Avatar"

export default function ContentModerationPage() {
  const [posts, setPosts] = useState<PostDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)

  const loadPosts = async () => {
    setLoading(true)
    try {
      const resp = await getAllPosts(0, 100)
      setPosts(resp.data || [])
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
      p.content.toLowerCase().includes(s) || 
      p.author.name.toLowerCase().includes(s)
    )
  }, [posts, searchTerm])

  const handleHidePost = async (postId: string) => {
    if (!window.confirm("Bạn có chắc muốn ẩn bài viết này khỏi bảng tin công cộng?")) return
    setActionLoading(postId)
    try {
      await adminService.hidePost(postId, "Vi phạm quy tắc cộng đồng (Moderated by Admin)")
      setMessage({ text: "Đã ẩn bài viết thành công", type: "success" })
      loadPosts()
    } catch (e) {
      setMessage({ text: "Lỗi khi ẩn bài viết", type: "error" })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn bài viết. Bạn có chắc chắn?")) return
    setActionLoading(postId)
    try {
      await deletePost(postId)
      setMessage({ text: "Đã xóa bài viết vĩnh viễn", type: "success" })
      loadPosts()
    } catch (e) {
      setMessage({ text: "Lỗi khi xóa bài viết", type: "error" })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
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
        <div className={`mb-6 rounded-xl p-4 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
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
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500">Ngày đăng</th>
                <th className="px-6 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                      Đang tải danh sách bài viết...
                    </div>
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy bài viết nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={post.author.name} avatarUrl={post.author.avatarUrl} size={36} />
                        <div>
                          <div className="text-[14px] font-bold text-slate-900">{post.author.name}</div>
                          <div className="text-[12px] text-slate-500">ID: {post.author.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="line-clamp-2 text-[14px] text-slate-700">
                        {post.content || <span className="italic text-slate-400">(Không có nội dung văn bản)</span>}
                      </div>
                      {post.imageUrl && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                          <ExternalLink size={12} /> Có kèm hình ảnh
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleHidePost(post.id)}
                          disabled={actionLoading === post.id}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="Ẩn bài viết"
                        >
                          <EyeOff size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          disabled={actionLoading === post.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
    </div>
  )
}

