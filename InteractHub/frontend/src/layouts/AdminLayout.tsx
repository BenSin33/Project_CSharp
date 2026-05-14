import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { LogOut, Shield, BarChart3, FileWarning, Users, Activity, Layout } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import Avatar from "../components/common/Avatar"

type AdminMenuTab = "dashboard" | "reports" | "users" | "content" | "logs"

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const menuItems: Array<{ id: AdminMenuTab; label: string; icon: React.ReactNode; path: string }> = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} />, path: "/admin" },
    { id: "reports", label: "Report Management", icon: <FileWarning size={18} />, path: "/admin/reports" },
    { id: "users", label: "User Management", icon: <Users size={18} />, path: "/admin/users" },
    { id: "content", label: "Content Moderation", icon: <Shield size={18} />, path: "/admin/content" },
    { id: "logs", label: "Settings Logs", icon: <Activity size={18} />, path: "/admin/logs" },
  ]

  const handleBackToApp = () => {
    navigate("/")
  }

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/"
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="flex h-full w-64 flex-col bg-[#2563EB] text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <div className="text-[17px] font-bold tracking-tight">InteractHub</div>
            <div className="text-[11px] font-medium text-blue-200">Admin Panel</div>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6 px-6">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <Avatar
              name={user?.name || "Admin"}
              avatarUrl={user?.avatarUrl}
              size={40}
              variant="indigo"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">You</div>
              <div className="truncate text-[11px] text-blue-200">Administrator</div>
            </div>
          </div>
        </div>
        {/* Back to App Switcher */}
        <div className="mb-4 px-3">
          <button
            onClick={handleBackToApp}
            className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-[14px] font-semibold text-white transition-all hover:bg-white/20"
          >
            <Layout size={18} />
            Switch to App UI
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1.5 px-3">
          {menuItems.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-all ${
                  active
                    ? "bg-white text-[#2563EB] shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={active ? "text-[#2563EB]" : "text-white/80"}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto px-3 pb-6 relative z-50">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#F8FAFC]">
        <Outlet />
      </main>
    </div>
  )
}
