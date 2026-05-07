import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileWarning,
  RefreshCw,
  Server,
  Shield,
  Users,
  Activity,
  UserSearch,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { adminService, type AdminDashboard, type AdminPostItem, type AdminReportItem, type AdminUserItem, type ReportStatus } from "../services/adminService"
import AdminReportsTab from "../components/admin/AdminReportsTab"
import AdminUsersTab from "../components/admin/AdminUsersTab"
import AdminLogsTab from "../components/admin/AdminLogsTab"

type AdminTab = "dashboard" | "reports" | "posts" | "users" | "logs"

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

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string
  value: number | string
  icon: ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determine activeTab from URL pathname
  const getActiveTabFromPath = (): AdminTab => {
    const pathname = location.pathname
    if (pathname.includes("/admin/reports")) return "reports"
    if (pathname.includes("/admin/users")) return "users"
    if (pathname.includes("/admin/logs")) return "logs"
    if (pathname.includes("/admin/posts")) return "posts"
    return "dashboard"
  }
  
  const [activeTab, setActiveTab] = useState<AdminTab>(getActiveTabFromPath())
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [reports, setReports] = useState<AdminReportItem[]>([])
  const [reportedPosts, setReportedPosts] = useState<AdminPostItem[]>([])
  const [pendingReviewPosts, setPendingReviewPosts] = useState<AdminPostItem[]>([])
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [userQuery, setUserQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all")
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboardResp, reportsResp, reportedPostsResp, pendingPostsResp] = await Promise.all([
        adminService.getDashboard(),
        adminService.getReports(0, 10, statusFilter),
        adminService.getReportedPosts(0, 8),
        adminService.getPostsPendingReview(),
      ])

      setDashboard(dashboardResp)
      setReports(reportsResp.data ?? [])
      setReportedPosts(reportedPostsResp ?? [])
      setPendingReviewPosts(pendingPostsResp ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) {
        setError("Bạn không có quyền truy cập trang admin này.")
      } else if (status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
      } else if (err?.code === "ERR_NETWORK" || !status) {
        setError("Không thể kết nối đến backend admin API.")
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? "Không thể tải dữ liệu admin.")
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const loadUsers = useCallback(async () => {
    if (activeTab !== "users") return

    setUsersLoading(true)
    try {
      const userList = userQuery.trim()
        ? await adminService.searchUsers(userQuery.trim(), 0, 20)
        : await adminService.getUsers()
      setUsers(userList)
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể tải danh sách user.")
    } finally {
      setUsersLoading(false)
    }
  }, [activeTab, userQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers()
    }, 300)
    return () => window.clearTimeout(timer)
  }, [activeTab, userQuery, loadUsers])

  useEffect(() => {
    if (activeTab !== "users") return
    void loadUsers()
  }, [activeTab, loadUsers])

  const statCards = useMemo(() => {
    const stats = dashboard?.stats
    return [
      {
        label: "Tổng người dùng",
        value: stats?.userStats?.totalUsers ?? 0,
        icon: <Users size={20} strokeWidth={2} />,
        hint: `Mới trong tháng: ${stats?.userStats?.newUsersThisMonth ?? 0}`,
      },
      {
        label: "Tổng bài viết",
        value: stats?.postStats?.totalPosts ?? 0,
        icon: <BarChart3 size={20} strokeWidth={2} />,
        hint: `Bài mới: ${stats?.postStats?.newPostsThisMonth ?? 0}`,
      },
      {
        label: "Báo cáo chờ xử lý",
        value: stats?.reportStats?.pendingReports ?? 0,
        icon: <FileWarning size={20} strokeWidth={2} />,
        hint: `Đã duyệt: ${stats?.reportStats?.reviewedReports ?? 0}`,
      },
      {
        label: "Tương tác",
        value: (stats?.engagementStats?.totalLikes ?? 0) + (stats?.engagementStats?.totalComments ?? 0),
        icon: <Activity size={20} strokeWidth={2} />,
        hint: `Like: ${stats?.engagementStats?.totalLikes ?? 0} · Comment: ${stats?.engagementStats?.totalComments ?? 0}`,
      },
    ]
  }, [dashboard])

  const updateReport = async (reportId: string, status: ReportStatus) => {
    const notes = window.prompt(`Nhập ghi chú cho trạng thái ${status}`, "Đã xử lý từ trang Admin")
    if (notes === null) return

    setActionLoading(`report-${reportId}`)
    try {
      await adminService.updateReportStatus(reportId, { status, adminNotes: notes })
      await loadData()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể cập nhật báo cáo.")
    } finally {
      setActionLoading(null)
    }
  }

  const hidePost = async (postId: string) => {
    const reason = window.prompt("Nhập lý do ẩn bài viết", "Vi phạm chính sách cộng đồng")
    if (!reason) return

    setActionLoading(`hide-${postId}`)
    try {
      await adminService.hidePost(postId, reason)
      await loadData()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể ẩn bài viết.")
    } finally {
      setActionLoading(null)
    }
  }

  const resolvePost = async (postId: string) => {
    setActionLoading(`resolve-${postId}`)
    try {
      await adminService.unhidePost(postId)
      await loadData()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể bỏ ẩn bài viết.")
    } finally {
      setActionLoading(null)
    }
  }

  const pageHeaderName = user?.name ?? "Admin"

  const tabs: Array<{ id: AdminTab; label: string; icon: ReactNode; path?: string }> = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} />, path: "/admin" },
    { id: "reports", label: "Reports", icon: <FileWarning size={14} />, path: "/admin/reports" },
    { id: "posts", label: "Posts", icon: <Activity size={14} />, path: "/admin/posts" },
    { id: "users", label: "Users", icon: <Users size={14} />, path: "/admin/users" },
    { id: "logs", label: "Logs", icon: <Activity size={14} />, path: "/admin/logs" },
  ]
  
  // Sync activeTab with URL changes
  useEffect(() => {
    const newTab = getActiveTabFromPath()
    setActiveTab(newTab)
  }, [location.pathname])
  
  const handleTabChange = (tabId: AdminTab) => {
    const tabPath = tabs.find(t => t.id === tabId)?.path || "/admin"
    navigate(tabPath, { replace: false })
  }

  const triggerUserAction = async (userId: string, action: "lock" | "unlock" | "admin" | "user") => {
    setActionLoading(`${action}-${userId}`)
    try {
      if (action === "lock") await adminService.lockUser(userId, 7)
      if (action === "unlock") await adminService.unlockUser(userId)
      if (action === "admin") await adminService.assignRole(userId, "Admin")
      if (action === "user") await adminService.assignRole(userId, "User")
      await loadData()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể thực hiện thao tác user.")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-600 via-violet-600 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/90">
              <Shield size={14} /> Admin Console
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Chào {pageHeaderName}, đây là bảng điều khiển quản trị</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Tất cả dữ liệu ở đây được lấy trực tiếp từ backend: dashboard, báo cáo nội dung, và danh sách bài viết bị gắn cờ.
            </p>
          </div>
          <button
            onClick={async () => {
              await loadData()
              if (activeTab === "users") {
                await loadUsers()
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "dashboard" ? (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Báo cáo mới nhất" subtitle="Dữ liệu từ /api/report, có thể lọc theo trạng thái." />

            <div className="mb-4 flex flex-wrap items-center gap-2">
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

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-110 overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Bài viết</th>
                      <th className="px-4 py-3 font-medium">Người báo cáo</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-8 text-slate-500" colSpan={4}>Đang tải dữ liệu...</td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-slate-500" colSpan={4}>Chưa có báo cáo nào.</td>
                      </tr>
                    ) : reports.map((report) => (
                      <tr key={report.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">{report.post?.content?.slice(0, 90) || "Bài viết bị báo cáo"}</div>
                          <div className="mt-1 text-xs text-slate-500">{report.reason || report.reportType || "No reason"}</div>
                          <div className="mt-1 text-xs text-slate-400">{formatDate(report.createdAt)}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <div className="font-medium text-slate-900">{report.reporter?.fullName || report.reporter?.name || "Ẩn danh"}</div>
                          <div className="text-xs text-slate-500">{report.reporter?.email || ""}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(report.status)}`}>
                            {report.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => updateReport(report.id, "Reviewed")}
                              disabled={actionLoading === `report-${report.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2 size={14} /> Reviewed
                            </button>
                            <button
                              onClick={() => updateReport(report.id, "Resolved")}
                              disabled={actionLoading === `report-${report.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2 size={14} /> Resolved
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionTitle title="Hoạt động gần đây" subtitle="Lấy từ dashboard backend." />
              <div className="space-y-3">
                {(dashboard?.recentActivities ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có hoạt động nào.</p>
                ) : (
                  dashboard?.recentActivities?.slice(0, 5).map((activity, index) => (
                    <div key={`${activity.timestamp}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="mt-0.5 rounded-xl bg-indigo-100 p-2 text-indigo-700">
                        <Clock3 size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900">{activity.description || activity.type || "Activity"}</div>
                        <div className="text-xs text-slate-500">{formatDate(activity.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionTitle title="Tác vụ chờ xử lý" subtitle="Phản ánh những việc admin cần ưu tiên." />
              <div className="space-y-3">
                {(dashboard?.pendingActions ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">Không có tác vụ chờ.</p>
                ) : (
                  dashboard?.pendingActions?.slice(0, 5).map((action, index) => (
                    <div key={`${action.title}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900">{action.title || action.actionType}</div>
                          <div className="text-xs text-slate-600">{action.description}</div>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-700">P{action.priority ?? 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <AdminReportsTab reports={reports} loading={loading} actionLoading={actionLoading} onRefresh={loadData} />
      ) : null}

      {activeTab === "users" ? (
        <AdminUsersTab users={users} loading={usersLoading} actionLoading={actionLoading} onRefresh={loadData} />
      ) : null}

      {activeTab === "logs" ? (
        <AdminLogsTab loading={loading} />
      ) : null}

      {activeTab === "posts" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title="Quản lý posts" subtitle="Danh sách bài viết bị gắn cờ và chờ xét duyệt." />
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Bài viết bị báo cáo</h3>
              <div className="space-y-3">
                {reportedPosts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{post.author?.fullName || post.author?.name || "Bài viết"}</div>
                        <p className="mt-1 text-sm text-slate-600">{post.content?.slice(0, 140) || "No content"}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">Reports: {post.reportCount ?? 0}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{post.status ?? "unknown"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => hidePost(post.id)} className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Ẩn</button>
                        <button onClick={() => resolvePost(post.id)} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Bỏ ẩn</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Chờ xét duyệt</h3>
              <div className="space-y-3">
                {pendingReviewPosts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-medium text-slate-900">{post.author?.fullName || post.author?.name || "Bài viết"}</div>
                    <p className="mt-1 text-sm text-slate-600">{post.content?.slice(0, 140) || "No content"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-1">Reports: {post.reportCount ?? 0}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">{post.visibility ?? "unknown"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "users" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title="Quản lý users" subtitle="Tìm kiếm, khóa/mở khóa và gán role trực tiếp từ backend." />
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <UserSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Tìm theo tên, email..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
              />
            </div>
            <div className="text-sm text-slate-500">{usersLoading ? "Đang tải..." : `${users.length} người dùng`}</div>
          </div>
          <div className="grid gap-3">
            {users.length === 0 ? (
              <p className="text-sm text-slate-500">Không có user nào để hiển thị.</p>
            ) : users.map((member) => (
              <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900">{member.fullName || member.email}</div>
                  <div className="text-sm text-slate-500">{member.email}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{member.roles?.length ? member.roles.join(", ") : "No role"}</span>
                    <span className={`rounded-full px-2 py-1 ${member.isLockedOut ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {member.isLockedOut ? "Locked" : "Active"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => triggerUserAction(member.id, "lock")}
                    disabled={actionLoading === `lock-${member.id}`}
                    className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-60"
                  >
                    Lock 7d
                  </button>
                  <button
                    onClick={() => triggerUserAction(member.id, "unlock")}
                    disabled={actionLoading === `unlock-${member.id}`}
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    Unlock
                  </button>
                  <button
                    onClick={() => triggerUserAction(member.id, "admin")}
                    disabled={actionLoading === `admin-${member.id}`}
                    className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 disabled:opacity-60"
                  >
                    Grant Admin
                  </button>
                  <button
                    onClick={() => triggerUserAction(member.id, "user")}
                    disabled={actionLoading === `user-${member.id}`}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
                  >
                    Set User
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600"><Server size={18} /> Backend connected</div>
          <p className="mt-2 text-sm text-slate-500">Trang này đang gọi trực tiếp các endpoint admin của ASP.NET Core API.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600"><Shield size={18} /> Role protected</div>
          <p className="mt-2 text-sm text-slate-500">Chỉ tài khoản có role Admin mới vào được route này.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600"><Activity size={18} /> Live moderation</div>
          <p className="mt-2 text-sm text-slate-500">Có thể duyệt báo cáo, ẩn/bỏ ẩn bài viết và reload dữ liệu ngay tại đây.</p>
        </div>
      </section>
    </div>
  )
}
