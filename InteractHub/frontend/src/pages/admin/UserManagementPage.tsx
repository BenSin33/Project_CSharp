import { useEffect, useState, useMemo, useRef } from "react"
import { CheckCircle2, Ban, Shield, MoreVertical, Search, Eye, Mail, Trash2, UserX } from "lucide-react"
import { adminService, type AdminUserItem } from "../../services/adminService"

function formatDate(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  
  const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const resp = await adminService.getUsers()
      setUsers(resp)
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const lowerQ = searchQuery.toLowerCase()
    return users.filter(u => 
      (u.fullName || "").toLowerCase().includes(lowerQ) || 
      (u.email || "").toLowerCase().includes(lowerQ)
    )
  }, [users, searchQuery])

  const stats = useMemo(() => {
    return {
      active: users.filter(u => !u.isLockedOut && u.status !== "Banned").length,
      suspended: users.filter(u => u.isLockedOut).length,
      banned: users.filter(u => u.status === "Banned").length,
      admins: users.filter(u => u.roles?.includes("Admin")).length,
    }
  }, [users])

  const handleAction = async (userId: string, action: string) => {
    setOpenDropdown(null)
    try {
      if (action === "suspend") {
        const reason = window.prompt("Reason for suspension:")
        if (reason) await adminService.suspendUser(userId, 7, reason)
      } else if (action === "ban") {
        const reason = window.prompt("Reason for banning:")
        if (reason) await adminService.banUser(userId, reason)
      } else if (action === "admin") {
        await adminService.assignRole(userId, "Admin")
      } else if (action === "delete") {
        if (window.confirm("Are you sure you want to delete this user permanently?")) {
          await adminService.deleteUserPermanently(userId)
        }
      }
      await loadData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">User Management</h1>
        <p className="mt-1 text-[15px] text-slate-500">Manage and moderate platform users</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Users */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.active}</div>
            <div className="text-[13px] font-medium text-slate-500">Active Users</div>
          </div>
        </div>

        {/* Suspended */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <UserX size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.suspended}</div>
            <div className="text-[13px] font-medium text-slate-500">Suspended</div>
          </div>
        </div>

        {/* Banned */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <Ban size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.banned}</div>
            <div className="text-[13px] font-medium text-slate-500">Banned</div>
          </div>
        </div>

        {/* Admins */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.admins}</div>
            <div className="text-[13px] font-medium text-slate-500">Admins</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[17px] font-semibold text-slate-900">All Users</h2>
        <p className="mt-1 text-[13px] text-slate-500">Search and manage user accounts</p>
        
        <div className="mb-6 mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-blue-500 focus:bg-white"
          />
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading users...</div>
        ) : (
          <div className="space-y-4" ref={dropdownRef}>
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName || "User"}&background=random`}
                    alt="avatar"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-slate-900">{user.fullName || "Unnamed User"}</span>
                      {user.roles?.includes("Admin") && (
                        <span className="flex items-center gap-1 rounded-full border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                          <Shield size={10} /> Admin
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        user.status === "Banned" ? "bg-red-50 text-red-600" :
                        user.isLockedOut ? "bg-orange-50 text-orange-600" :
                        "bg-green-50 text-green-600"
                      }`}>
                        {user.status === "Banned" ? "banned" : user.isLockedOut ? "suspended" : "active"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-500">
                      <span>{user.email}</span>
                      <span>·</span>
                      <span>{user.status === "Banned" ? `Banned ${formatDate(user.bannedAt)}` : `Joined ${formatDate(user.createdAt)}`}</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {openDropdown === user.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50">
                        <Eye size={16} /> View Profile
                      </button>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50">
                        <Mail size={16} /> Send Message
                      </button>
                      <button onClick={() => handleAction(user.id, "suspend")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-orange-600 hover:bg-orange-50">
                        <UserX size={16} /> Suspend User
                      </button>
                      <button onClick={() => handleAction(user.id, "ban")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50">
                        <Ban size={16} /> Ban User
                      </button>
                      <button onClick={() => handleAction(user.id, "admin")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-blue-600 hover:bg-blue-50">
                        <Shield size={16} /> Make Admin
                      </button>
                      <button onClick={() => handleAction(user.id, "delete")} className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50">
                        <Trash2 size={16} /> Delete User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="py-8 text-center text-slate-500">No users found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
