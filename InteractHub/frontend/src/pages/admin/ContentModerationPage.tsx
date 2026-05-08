import { useEffect, useState, useMemo } from "react"
import { AlertTriangle, XCircle, CheckCircle2, Eye } from "lucide-react"
import { adminService, type AdminReportItem } from "../../services/adminService"

export default function ContentModerationPage() {
  const [reports, setReports] = useState<AdminReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"Pending" | "Reviewed">("Pending")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const resp = await adminService.getReports(0, 50, "all")
      setReports(resp.data || [])
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
    return reports.filter(r => (r.status || "Pending") === tab)
  }, [reports, tab])

  const pendingCount = useMemo(() => reports.filter(r => (r.status || "Pending") === "Pending").length, [reports])

  const handleRemoveContent = async (reportId: string, postId?: string) => {
    setActionLoading(reportId)
    try {
      if (postId) {
        try {
          await adminService.hidePost(postId, "Vi phạm nội dung (Moderation)")
        } catch (e) {
          console.error("hidePost failed:", e)
        }
      }
      await adminService.updateReportStatus(reportId, { status: "Resolved", adminNotes: "Đã gỡ nội dung" })
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleKeepContent = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await adminService.updateReportStatus(reportId, { status: "Reviewed", adminNotes: "Nội dung hợp lệ" })
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-bold text-slate-900">
            <AlertTriangle className="text-orange-500" size={32} />
            Content Moderation
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">Review and moderate reported content</p>
        </div>
        {pendingCount > 0 && (
          <div className="rounded-lg bg-red-600 px-4 py-2 text-[14px] font-semibold text-white">
            {pendingCount} Pending
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab("Pending")}
            className={`flex flex-1 items-center justify-center gap-2 py-4 text-[14px] font-semibold transition-all ${
              tab === "Pending" ? "border-b-2 border-red-500 text-red-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending Reports
            {pendingCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("Reviewed")}
            className={`flex flex-1 items-center justify-center gap-2 py-4 text-[14px] font-semibold transition-all ${
              tab === "Reviewed" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Reviewed Reports
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading content...</div>
          ) : (
            <div className="space-y-6">
              {filteredReports.map((report) => (
                <div key={report.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${report.reporter?.fullName || "User"}&background=random`}
                        alt="avatar"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-[15px] font-semibold text-slate-900">{report.reporter?.fullName || "Anonymous"}</div>
                        <div className="text-[13px] text-slate-500">Reported a {report.reportType?.toLowerCase() || "post"}</div>
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                      {report.reportType || "post"}
                    </div>
                  </div>

                  <div className="my-5 space-y-4">
                    <div>
                      <div className="text-[13px] font-medium text-slate-500">Reason</div>
                      <div className="mt-1 text-[14px] font-medium text-slate-900">{report.reason || "No reason provided"}</div>
                    </div>

                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                        <Eye size={14} /> Reported Content Preview
                      </div>
                      <div className="text-[13px] text-slate-600">
                        <span className="font-medium">Content ID:</span> {report.postId || "Unknown"}
                      </div>
                      <div className="mt-2 text-[14px] text-slate-800">
                        {report.post?.content || "[Preview would show actual content here]"}
                      </div>
                    </div>
                  </div>

                  {tab === "Pending" && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRemoveContent(report.id, report.postId)}
                        disabled={actionLoading === report.id}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E11D48] py-3 text-[14px] font-semibold text-white transition-all hover:bg-rose-700 disabled:opacity-50"
                      >
                        <XCircle size={18} /> Remove Content
                      </button>
                      <button
                        onClick={() => handleKeepContent(report.id)}
                        disabled={actionLoading === report.id}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-[14px] font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                      >
                        <CheckCircle2 size={18} /> Keep Content
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="py-8 text-center text-slate-500">No {tab.toLowerCase()} reports.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
