import { useEffect, useState, useMemo } from "react"
import { Flag, Eye, CheckCircle2, AlertCircle, XCircle, Trash2, X } from "lucide-react"
import { adminService, type AdminReportItem } from "../../services/adminService"

function formatDate(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  
  const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

interface DeleteModalState {
  open: boolean
  reportId: string
  postId?: string
  postContent?: string
}

export default function ReportManagementPage() {
  const [reports, setReports] = useState<AdminReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"Pending" | "Reviewed" | "Resolved" | "All">("All")
  const [globalStats, setGlobalStats] = useState({ pending: 0, reviewed: 0, resolved: 0, total: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ open: false, reportId: "", postId: undefined })

  const loadData = async () => {
    setLoading(true)
    try {
      const resp = await adminService.getReports(0, 50, "all")
      setReports(resp.data || [])
      setGlobalStats({
        pending: resp.pendingCount ?? 0,
        reviewed: resp.reviewedCount ?? 0,
        resolved: resp.resolvedCount ?? 0,
        total: resp.total ?? 0
      })
    } catch (error) {
      console.error("Failed to load reports:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredReports = useMemo(() => {
    if (filter === "All") return reports
    return reports.filter(r => (r.status || "Pending") === filter)
  }, [reports, filter])

  const stats = useMemo(() => {
    const highPriority = reports.filter(r => (r.reportType || "").toLowerCase().includes("spam") || (r.reason || "").toLowerCase().includes("harassment")).length
    
    return { 
      pending: globalStats.pending, 
      reviewed: globalStats.reviewed, 
      resolved: globalStats.resolved, 
      highPriority, 
      all: globalStats.total 
    }
  }, [reports, globalStats])

  const handleApproveRemove = async (reportId: string, postId?: string) => {
    setActionLoading(reportId)
    try {
      if (postId) {
        try {
          await adminService.hidePost(postId, "Vi phạm chính sách (Báo cáo duyệt)")
        } catch (e) {
          console.error("hidePost failed:", e)
        }
      }
      await adminService.updateReportStatus(reportId, { status: "Resolved", adminNotes: "Đã ẩn bài viết" })
      setMessage({ text: "Đã duyệt và ẩn bài viết thành công", type: "success" })
      await loadData()
    } catch (e) {
      console.error(e)
      setMessage({ text: "Lỗi khi xử lý báo cáo", type: "error" })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const handleDismiss = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await adminService.updateReportStatus(reportId, { status: "Resolved", adminNotes: "Báo cáo không hợp lệ/Đã bỏ qua" })
      setMessage({ text: "Đã bỏ qua báo cáo", type: "success" })
      await loadData()
    } catch (e) {
      console.error(e)
      setMessage({ text: "Lỗi khi bỏ qua báo cáo", type: "error" })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const openDeleteModal = (reportId: string, postId?: string, postContent?: string) => {
    setDeleteModal({ open: true, reportId, postId, postContent })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, reportId: "", postId: undefined })
  }

  const executeDeletePermanently = async () => {
    const { reportId, postId } = deleteModal
    closeDeleteModal()
    setActionLoading(reportId)
    try {
      if (postId) {
        try {
          await adminService.deletePost(postId, { reason: "Vi phạm nghiêm trọng", adminNotes: "Xóa vĩnh viễn từ màn hình Admin" })
        } catch (e) {
          console.error("deletePost failed:", e)
        }
      }
      await adminService.updateReportStatus(reportId, { status: "Resolved", adminNotes: "Đã xóa vĩnh viễn bài viết" })
      setMessage({ text: "Đã xóa vĩnh viễn bài viết vi phạm", type: "success" })
      await loadData()
    } catch (e) {
      console.error(e)
      setMessage({ text: "Lỗi khi xóa bài viết", type: "error" })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <div className="p-8">
      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 rounded-xl p-4 text-sm font-medium flex items-center gap-2 ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">Report Management</h1>
        <p className="mt-1 text-[15px] text-slate-500">Review and manage user reports and flagged content</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Flag size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.pending}</div>
            <div className="text-[13px] font-medium text-slate-500">Pending</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <Eye size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.reviewed}</div>
            <div className="text-[13px] font-medium text-slate-500">Reviewed</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.resolved}</div>
            <div className="text-[13px] font-medium text-slate-500">Resolved</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.highPriority}</div>
            <div className="text-[13px] font-medium text-slate-500">High Priority</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[17px] font-semibold text-slate-900">All Reports</h2>
        <p className="mb-6 mt-1 text-[13px] text-slate-500">Review and take action on reported content</p>
        
        <div className="mb-6 flex gap-2">
          {["Pending", "Reviewed", "Resolved", "All"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f} ({f === "All" ? stats.all : f === "Pending" ? stats.pending : f === "Reviewed" ? stats.reviewed : stats.resolved})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading reports...</div>
        ) : (
          <div className="space-y-6">
            {filteredReports.map((report) => (
              <div key={report.id} className="rounded-xl border border-slate-200 p-5">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <span className="text-sm font-bold text-slate-600">
                      {report.reporter?.fullName?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px]">
                      <span className="font-semibold text-slate-900">{report.reporter?.fullName || report.reporter?.name || "Anonymous"}</span>
                      <span className="text-slate-500"> reported </span>
                      <span className="font-semibold text-slate-900">{report.post?.author?.fullName || report.post?.author?.name || "User"}</span>
                    </div>
                    
                    <div className="mt-1 flex gap-2">
                      <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">high priority</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">post</span>
                      <span className="rounded bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">{report.status || "pending"}</span>
                      <span className="ml-2 text-[12px] text-slate-400">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4 text-[14px]">
                  <span className="font-medium text-slate-700">Reason:</span> {report.reason || report.reportType || "No reason"}
                </div>

                {report.post?.content && (
                  <div className="mb-5 border-l-4 border-red-400 bg-slate-50 p-4 text-[14px] italic text-slate-700">
                    "{report.post.content}"
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApproveRemove(report.id, report.postId)}
                    disabled={actionLoading === report.id}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Approve & Remove
                  </button>
                  <button
                    onClick={() => handleDismiss(report.id)}
                    disabled={actionLoading === report.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <XCircle size={16} /> Dismiss
                  </button>
                  <button
                    onClick={() => openDeleteModal(report.id, report.postId, report.post?.content)}
                    disabled={actionLoading === report.id}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={16} /> Delete Permanently
                  </button>
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="py-8 text-center text-slate-500">No reports found matching the criteria.</div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Xóa bài viết vĩnh viễn</h3>
              <button onClick={closeDeleteModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="mb-2 text-[14px] text-slate-600">
              CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn bài viết vi phạm và không thể hoàn tác.
            </p>
            {deleteModal.postContent && (
              <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[13px] italic text-slate-600">
                "{deleteModal.postContent.slice(0, 100)}..."
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={executeDeletePermanently}
                className="rounded-xl bg-red-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-700"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
