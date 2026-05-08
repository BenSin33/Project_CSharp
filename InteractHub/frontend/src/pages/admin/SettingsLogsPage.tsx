import { useEffect, useState, useMemo } from "react"
import { FileText, AlertCircle, Shield, Users, Search, Activity, Settings } from "lucide-react"
import { adminService, type ActivityLogItem } from "../../services/adminService"

function formatDate(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function SettingsLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("All")

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const resp = await adminService.getActivityLogs(0, 100)
        setLogs(resp.data || [])
      } catch (error) {
        console.error("Failed to load logs:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredLogs = useMemo(() => {
    let result = logs
    if (filter !== "All") {
      result = result.filter(l => l.actionCategory === filter || (filter === "Users" && l.actionCategory === "User"))
    }
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase()
      result = result.filter(l => 
        (l.action || "").toLowerCase().includes(lowerQ) ||
        (l.adminName || "").toLowerCase().includes(lowerQ) ||
        (l.reason || "").toLowerCase().includes(lowerQ)
      )
    }
    return result
  }, [logs, searchQuery, filter])

  const stats = useMemo(() => {
    return {
      total: logs.length,
      critical: logs.filter(l => l.severity === "High" || l.severity === "Critical").length,
      security: logs.filter(l => l.actionCategory === "Security").length,
      userActions: logs.filter(l => l.actionCategory === "User").length,
      content: logs.filter(l => l.actionCategory === "Post" || l.actionCategory === "Report").length,
    }
  }, [logs])

  const getLogIcon = (category: string) => {
    switch (category) {
      case "Security": return <Shield size={20} className="text-orange-500" />
      case "User": return <Users size={20} className="text-purple-500" />
      case "Post":
      case "Report": return <FileText size={20} className="text-yellow-500" />
      case "System": return <Activity size={20} className="text-green-500" />
      default: return <Settings size={20} className="text-slate-500" />
    }
  }

  const getLogIconBg = (category: string) => {
    switch (category) {
      case "Security": return "bg-orange-50"
      case "User": return "bg-purple-50"
      case "Post":
      case "Report": return "bg-yellow-50"
      case "System": return "bg-green-50"
      default: return "bg-slate-50"
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">Settings Logs</h1>
        <p className="mt-1 text-[15px] text-slate-500">View system activity and admin actions</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Logs */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.total}</div>
            <div className="text-[13px] font-medium text-slate-500">Total Logs</div>
          </div>
        </div>

        {/* Critical */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.critical}</div>
            <div className="text-[13px] font-medium text-slate-500">Critical</div>
          </div>
        </div>

        {/* Security */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.security}</div>
            <div className="text-[13px] font-medium text-slate-500">Security</div>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.userActions}</div>
            <div className="text-[13px] font-medium text-slate-500">User Actions</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[17px] font-semibold text-slate-900">Activity Logs</h2>
        <p className="mt-1 text-[13px] text-slate-500">Detailed log of all system activities and changes</p>
        
        <div className="my-6 relative max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search logs by action, user, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {["All", "Security", "Users", "Content", "System", "Settings"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f} {f === "All" ? `(${stats.total})` : f === "Security" ? `(${stats.security})` : f === "Users" ? `(${stats.userActions})` : f === "Content" ? `(${stats.content})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading logs...</div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:bg-slate-50">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getLogIconBg(log.actionCategory)}`}>
                  {getLogIcon(log.actionCategory)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-slate-900">{log.action || "Unknown Action"}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      log.severity === "High" || log.severity === "Critical" ? "bg-red-50 text-red-600" :
                      log.severity === "Medium" ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"
                    }`}>
                      {log.severity || "low"}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {log.actionCategory || "System"}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-[14px] text-slate-700">
                    {log.reason || `Admin performed ${log.action} action`}
                  </div>
                  
                  <div className="mt-3 flex items-center gap-3 text-[12px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={`https://ui-avatars.com/api/?name=${log.adminName || "Admin"}&background=random`}
                        alt="Admin"
                        className="h-5 w-5 rounded-full"
                      />
                      <span className="font-medium text-slate-700">{log.adminName || "Admin User"}</span>
                    </div>
                    <span>·</span>
                    <span>{formatDate(log.createdAt)}</span>
                    <span>·</span>
                    <span>IP: {log.ipAddress || "127.0.0.1"}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="py-8 text-center text-slate-500">No logs found matching the criteria.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
