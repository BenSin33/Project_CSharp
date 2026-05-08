import { useEffect, useState, useMemo } from "react"
import { Users, FileText, Flag, Activity } from "lucide-react"
import { adminService, type AdminDashboard, type AdminUserItem } from "../../services/adminService"

function formatNumber(num: number | undefined) {
  if (num === undefined) return "0"
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatDate(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  
  const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [dashResp, usersResp] = await Promise.all([
          adminService.getDashboard(),
          adminService.getUsers(),
        ])
        setDashboard(dashResp)
        setUsers(usersResp)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = dashboard?.stats

  const topUsers = useMemo(() => {
    // Mock sort users to show most active ones. In reality, should come from API ordered by follower/post count.
    return [...users].slice(0, 5)
  }, [users])

  if (loading) {
    return <div className="p-8 text-slate-500">Loading dashboard...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-[15px] text-slate-500">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
              <Users size={24} />
            </div>
            <div className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
              +12.5%
            </div>
          </div>
          <div className="mt-6">
            <div className="text-[28px] font-bold text-slate-900">{formatNumber(stats?.totalUsers)}</div>
            <div className="text-[13px] font-medium text-slate-500">Total Users</div>
          </div>
        </div>

        {/* Total Posts */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500">
              <FileText size={24} />
            </div>
            <div className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
              +8.2%
            </div>
          </div>
          <div className="mt-6">
            <div className="text-[28px] font-bold text-slate-900">{formatNumber(stats?.totalPosts)}</div>
            <div className="text-[13px] font-medium text-slate-500">Total Posts</div>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Flag size={24} />
            </div>
            <div className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
              -15.3%
            </div>
          </div>
          <div className="mt-6">
            <div className="text-[28px] font-bold text-slate-900">{formatNumber(stats?.pendingReports)}</div>
            <div className="text-[13px] font-medium text-slate-500">Pending Reports</div>
          </div>
        </div>

        {/* Active Users */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
              <Activity size={24} />
            </div>
            <div className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
              +5.7%
            </div>
          </div>
          <div className="mt-6">
            <div className="text-[28px] font-bold text-slate-900">{formatNumber(stats?.activeUsersThisMonth)}</div>
            <div className="text-[13px] font-medium text-slate-500">Active Users (24h)</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[17px] font-semibold text-slate-900">Recent Activities</h2>
          <p className="mb-6 mt-1 text-[13px] text-slate-500">Latest platform activities and events</p>
          
          <div className="space-y-6">
            {dashboard?.recentActivity?.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-red-500 ring-4 ring-red-50" />
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-slate-900">{activity.type || "Activity"}</div>
                  <div className="mt-0.5 text-[13px] text-slate-600">{activity.description}</div>
                  <div className="mt-1 text-[12px] text-slate-400">{formatDate(activity.timestamp)}</div>
                </div>
              </div>
            ))}
            {(!dashboard?.recentActivity || dashboard.recentActivity.length === 0) && (
              <div className="text-[14px] text-slate-500">No recent activities.</div>
            )}
          </div>
        </div>

        {/* Top Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[17px] font-semibold text-slate-900">Top Users</h2>
          <p className="mb-6 mt-1 text-[13px] text-slate-500">Most active users on the platform</p>
          
          <div className="space-y-5">
            {topUsers.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-[13px] font-bold text-white">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-slate-900">{user.fullName || user.email}</div>
                    <div className="text-[12px] text-slate-500">1.2k posts · 8.5k followers</div>
                  </div>
                </div>
                <div className="rounded-full border border-green-200 px-3 py-1 text-[11px] font-semibold text-green-600">
                  active
                </div>
              </div>
            ))}
            {topUsers.length === 0 && (
              <div className="text-[14px] text-slate-500">No users found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
