import { useState, useEffect } from "react"
import { Activity, TrendingUp, AlertCircle } from "lucide-react"
import { adminService, type ActivityLogItem, type ActivityLogStats } from "../../services/adminService"

interface AdminLogsTabProps {
  loading: boolean
}

function severityStyle(severity?: string) {
  const normalized = (severity ?? "").toLowerCase()
  if (normalized === "critical") return "bg-red-50 text-red-700 border-red-200"
  if (normalized === "warning") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-blue-50 text-blue-700 border-blue-200"
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("vi-VN")
}

export default function AdminLogsTab({ loading: parentLoading }: AdminLogsTabProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [stats, setStats] = useState<ActivityLogStats | null>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [severity, setSeverity] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)

  const loadLogs = async () => {
    setInternalLoading(true)
    try {
      const [logsResp, statsResp] = await Promise.all([
        adminService.getActivityLogs(0, 50, undefined, action || undefined, severity || undefined),
        adminService.getActivityStats(),
      ])
      setLogs(logsResp.data || [])
      setStats(statsResp)
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể tải activity logs.")
    } finally {
      setInternalLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [severity, action])

  const currentLoading = internalLoading || parentLoading

  const actionTypes = [
    "BanUser",
    "UnbanUser",
    "SuspendUser",
    "UnsuspendUser",
    "DeleteUser",
    "DeletePost",
    "HidePost",
    "UnhidePost",
    "UpdateReport",
  ]

  const severityTypes = ["Info", "Warning", "Critical"]

  return (
    <section className="space-y-6">
      {/* Stats Cards */}
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Tổng hoạt động</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalLogs ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Activity size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Critical</p>
                <p className="mt-2 text-2xl font-bold text-red-600">{stats.criticalLogs ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Warning</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">{stats.warningLogs ?? 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Loại hành động</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {Object.keys(stats?.actionCategory || {}).length ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Activity size={20} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900">Bộ lọc</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Mức độ</label>
            <select
              value={severity || ""}
              onChange={(e) => setSeverity(e.target.value || null)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Tất cả mức độ</option>
              {severityTypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Hành động</label>
            <select
              value={action || ""}
              onChange={(e) => setAction(e.target.value || null)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Tất cả hành động</option>
              {actionTypes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Nhật ký hoạt động</h2>
          <p className="mt-1 text-sm text-slate-500">Lịch sử tất cả các hành động quản trị</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">Quản trị viên</th>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                  <th className="px-4 py-3 font-medium">Mục tiêu</th>
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Không có nhật ký nào
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">
                            {log.admin?.fullName || log.admin?.name || "System"}
                          </div>
                          <div className="text-xs text-slate-500">{log.admin?.email || ""}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{log.action}</div>
                          <div className="text-xs text-slate-500">{log.actionCategory}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 max-w-xs truncate">
                        {log.targetUser?.fullName ? (
                          <div>
                            <div className="font-medium">{log.targetUser.fullName}</div>
                            <div className="text-xs text-slate-500">{log.targetUser.email}</div>
                          </div>
                        ) : log.targetPostId ? (
                          <div className="text-xs">Bài viết: {log.targetPostId.slice(0, 8)}...</div>
                        ) : log.targetReportId ? (
                          <div className="text-xs">Báo cáo: {log.targetReportId.slice(0, 8)}...</div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${severityStyle(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="mt-4 text-xs text-slate-500">
            Hiển thị {logs.length} trong {stats?.totalLogs ?? 0} nhật ký
          </div>
        )}
      </div>
    </section>
  )
}
