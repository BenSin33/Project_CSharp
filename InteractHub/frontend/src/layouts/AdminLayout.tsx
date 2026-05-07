import { useCallback, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { Menu, X, LogOut, Shield, BarChart3, FileWarning, Users, Activity } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

type AdminMenuTab = "dashboard" | "reports" | "users" | "logs"

export default function AdminLayout() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = useCallback(async () => {
    if (window.confirm("Bạn chắc chắn muốn đăng xuất?")) {
      await logout()
      navigate("/login")
    }
  }, [logout, navigate])

  const menuItems: Array<{ id: AdminMenuTab; label: string; icon: React.ReactNode; path: string }> = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} />, path: "/admin" },
    { id: "reports", label: "Report Management", icon: <FileWarning size={18} />, path: "/admin/reports" },
    { id: "users", label: "User Management", icon: <Users size={18} />, path: "/admin/users" },
    { id: "logs", label: "Settings Logs", icon: <Activity size={18} />, path: "/admin/logs" },
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white transition-all duration-300 lg:relative lg:translate-x-0 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-indigo-500 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-lg font-bold">InteractHub</div>
            <div className="text-xs text-indigo-200">Admin Panel</div>
          </div>
        </div>

        {/* User Info */}
        <div className="border-b border-indigo-500 px-6 py-4">
          <div className="text-sm font-medium">{user?.name ?? "Admin"}</div>
          <div className="text-xs text-indigo-200">{user?.email ?? "admin@example.com"}</div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path)
                setSidebarOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition hover:bg-indigo-500"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-indigo-500 px-4 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition hover:bg-red-500"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex-1" />
            <div className="text-sm font-medium text-slate-700">{user?.name ?? "Admin"}</div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
