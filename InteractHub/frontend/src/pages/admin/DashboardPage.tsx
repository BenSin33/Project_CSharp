import { useEffect, useState } from "react"
import { Users, FileText, Flag, Activity, TrendingUp } from "lucide-react"
import { adminService, type AdminDashboard } from "../../services/adminService"
import Avatar from "../../components/common/Avatar"

function formatNumber(num: number | undefined) {
  if (num === undefined) return "0"
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatDate(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  
  const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const dashResp = await adminService.getDashboard()
        setDashboard(dashResp)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = dashboard?.stats
  const topUsers = dashboard?.topUsers || []

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-[15px] text-slate-500">Platform-wide statistics and management summary.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-indigo-700 lg:flex">
          <TrendingUp size={16} />
          <span className="text-[13px] font-bold">Real-time Data Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "blue" },
          { label: "Total Posts", value: stats?.totalPosts, icon: FileText, color: "green" },
          { label: "Pending Reports", value: stats?.pendingReports, icon: Flag, color: "orange" },
          { label: "Active Users (24h)", value: stats?.activeUsersThisMonth, icon: Activity, color: "purple" },
        ].map((item, idx) => (
          <div key={idx} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors bg-${item.color}-50 text-${item.color}-500 group-hover:bg-indigo-600 group-hover:text-white`}>
                <item.icon size={24} />
              </div>
            </div>
            <div className="mt-6">
              <div className="text-[28px] font-bold text-slate-900">{formatNumber(item.value)}</div>
              <div className="text-[13px] font-medium text-slate-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900">Recent Activities</h2>
              <p className="mt-1 text-[13px] text-slate-500">Latest platform events</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-5">
            {dashboard?.recentActivity?.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="group flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-indigo-500 ring-4 ring-indigo-50 transition-all group-hover:scale-125" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-slate-900">
                      {activity.type === "NewUser" ? "✨ New Registration" : 
                       activity.type === "NewReport" ? "⚠️ Content Report" : 
                       activity.type === "NewPost" ? "📝 New Content" : (activity.type || "Activity")}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{formatDate(activity.timestamp)}</span>
                  </div>
                  <div className="mt-0.5 text-[13px] text-slate-600 line-clamp-1">{activity.description}</div>
                </div>
              </div>
            ))}
            {(!dashboard?.recentActivity || dashboard.recentActivity.length === 0) && (
              <div className="flex h-32 flex-col items-center justify-center text-slate-400">
                <Activity size={32} className="mb-2 opacity-20" />
                <p className="text-[13px]">No recent activities recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Users */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900">Top Influencers</h2>
              <p className="mt-1 text-[13px] text-slate-500">Most active users by engagement</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-5">
            {topUsers.map((user, idx) => (
              <div key={user.id} className="group flex items-center justify-between rounded-xl border border-transparent p-1 transition-all hover:bg-slate-50 hover:px-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    #{idx + 1}
                  </div>
                  <Avatar name={user.fullName} avatarUrl={user.avatarUrl} size={42} variant="indigo" />
                  <div>
                    <div className="text-[15px] font-semibold text-slate-900">{user.fullName}</div>
                    <div className="text-[12px] text-slate-500 font-medium">
                      <span className="text-indigo-600">{user.postCount}</span> posts · <span className="text-blue-600">{user.friendCount}</span> friends
                    </div>
                  </div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[11px] font-bold capitalize ${
                  user.status === "active" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {user.status}
                </div>
              </div>
            ))}
            {topUsers.length === 0 && (
              <div className="flex h-32 flex-col items-center justify-center text-slate-400">
                <Users size={32} className="mb-2 opacity-20" />
                <p className="text-[13px]">No influencers found yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

