import { useState, useCallback } from "react"
import { FileWarning, CheckCircle2 } from "lucide-react"
import { adminService, type AdminReportItem, type ReportStatus } from "../../services/adminService"

interface AdminReportsTabProps {
  reports: AdminReportItem[]
  loading: boolean
  actionLoading: string | null
  onRefresh: () => Promise<void>
}

const reportStatusOptions: Array<{ label: string; value: ReportStatus | "all" }> = [
  { label: "Tất cả", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Reviewed", value: "Reviewed" },
  { label: "Resolved", value: "Resolved" },
]

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("vi-VN")
}

function statusStyle(status?: string) {
  const normalized = (status ?? "").toLowerCase()
  if (normalized === "resolved") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (normalized === "reviewed") return "bg-blue-50 text-blue-700 border-blue-200"
  if (normalized === "pending") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-slate-100 text-slate-700 border-slate-200"
}

export default function AdminReportsTab({ reports, loading, actionLoading, onRefresh }: AdminReportsTabProps) {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all")
  const [internalActionLoading, setInternalActionLoading] = useState<string | null>(null)

  const updateReport = useCallback(async (reportId: string, status: ReportStatus) => {
    const notes = window.prompt(`Nhập ghi chú cho trạng thái ${status}`, "Đã xử lý từ trang Admin")
    if (notes === null) return

    setInternalActionLoading(`report-${reportId}`)
    try {
      await adminService.updateReportStatus(reportId, { status, adminNotes: notes })
      await onRefresh()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể cập nhật báo cáo.")
    } finally {
      setInternalActionLoading(null)
    }
  }, [onRefresh])

  const filteredReports = statusFilter === "all" ? reports : reports.filter(r => r.status === statusFilter)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Quản lý báo cáo</h2>
        <p className="mt-1 text-sm text-slate-500">Xử lý các báo cáo vi phạm nội dung từ người dùng</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {reportStatusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              statusFilter === option.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            Không có báo cáo nào
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-slate-200 p-4 hover:border-slate-300">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                      <FileWarning size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">
                        {report.post?.content?.slice(0, 100) || "Bài viết bị báo cáo"}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        <p><strong>Loại báo cáo:</strong> {report.reason || report.reportType || "Không xác định"}</p>
                        <p className="mt-1"><strong>Người báo cáo:</strong> {report.reporter?.fullName || report.reporter?.name || "Ẩn danh"}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(report.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(report.status)}`}>
                    {report.status || "Pending"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {report.status !== "Reviewed" && (
                      <button
                        onClick={() => updateReport(report.id, "Reviewed")}
                        disabled={internalActionLoading === `report-${report.id}` || (actionLoading?.startsWith("report-") && actionLoading !== `report-${report.id}`)  }
                        className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 size={14} /> Reviewed
                      </button>
                    )}
                    <button
                      onClick={() => updateReport(report.id, "Resolved")}
                      disabled={internalActionLoading === `report-${report.id}` || (actionLoading?.startsWith("report-") && actionLoading !== `report-${report.id}`)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={14} /> Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
