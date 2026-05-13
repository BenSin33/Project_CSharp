import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Ban, Shield, MoreVertical, Search, Eye, Mail, Trash2, UserX, X } from "lucide-react"
import { adminService, type AdminUserItem } from "../../services/adminService"
import Avatar from "../../components/common/Avatar"

function formatDate(value?: string) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  
  const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

interface ModalState {
  type: "suspend" | "unsuspend" | "ban" | "unban" | "delete" | "admin" | "removeAdmin" | null
  userId: string
  userName: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: null, userId: "", userName: "" })
  const [modalReason, setModalReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await adminService.getUsers()
      setUsers(resp)
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const openModal = (type: ModalState["type"], userId: string, userName: string) => {
    setOpenDropdown(null)
    setModal({ type, userId, userName })
    setModalReason("")
  }

  const closeModal = () => {
    setModal({ type: null, userId: "", userName: "" })
    setModalReason("")
  }

  const executeAction = async () => {
    if (!modal.type) return
    setActionLoading(true)
    try {
      switch (modal.type) {
        case "suspend":
          if (!modalReason.trim()) return
          await adminService.suspendUser(modal.userId, 7, modalReason)
          setMessage({ text: `User "${modal.userName}" has been suspended for 7 days`, type: "success" })
          break
        case "unsuspend":
          await adminService.unsuspendUser(modal.userId)
          setMessage({ text: `Suspension removed for "${modal.userName}"`, type: "success" })
          break
        case "ban":
          if (!modalReason.trim()) return
          await adminService.banUser(modal.userId, modalReason)
          setMessage({ text: `User "${modal.userName}" has been banned`, type: "success" })
          break
        case "unban":
          await adminService.unbanUser(modal.userId)
          setMessage({ text: `User "${modal.userName}" has been unbanned`, type: "success" })
          break
        case "delete":
          await adminService.deleteUserPermanently(modal.userId)
          setMessage({ text: `User "${modal.userName}" has been permanently deleted`, type: "success" })
          break
        case "admin":
          await adminService.assignRole(modal.userId, "Admin")
          setMessage({ text: `User "${modal.userName}" is now an Admin`, type: "success" })
          break
        case "removeAdmin":
          await adminService.removeRole(modal.userId, "Admin")
          setMessage({ text: `Admin role removed from "${modal.userName}"`, type: "success" })
          break
      }
      closeModal()
      await loadData()
    } catch (e: any) {
      console.error(e)
      setMessage({ text: `Action failed: ${e?.message || "Unknown error"}`, type: "error" })
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const needsReason = modal.type === "suspend" || modal.type === "ban"
  const modalTitle = {
    suspend: "Suspend User",
    unsuspend: "Unsuspend User",
    ban: "Ban User",
    unban: "Unban User",
    delete: "Delete User Permanently",
    admin: "Make Admin",
    removeAdmin: "Remove Admin Role",
  }[modal.type || "suspend"]

  const modalDescription = {
    suspend: `Suspend "${modal.userName}" for 7 days. Please provide a reason:`,
    unsuspend: `Are you sure you want to lift the suspension for "${modal.userName}"?`,
    ban: `Ban "${modal.userName}" permanently. Please provide a reason:`,
    unban: `Are you sure you want to unban "${modal.userName}"? They will be able to log in again.`,
    delete: `Are you sure you want to permanently delete "${modal.userName}"? This action CANNOT be undone.`,
    admin: `Grant Admin privileges to "${modal.userName}"?`,
    removeAdmin: `Remove Admin privileges from "${modal.userName}"?`,
  }[modal.type || "suspend"]

  return (
    <div className="p-8">
      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 rounded-xl p-4 text-sm font-medium flex items-center gap-2 ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <Ban size={18} />}
          {message.text}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">User Management</h1>
        <p className="mt-1 text-[15px] text-slate-500">Manage and moderate platform users</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.active}</div>
            <div className="text-[13px] font-medium text-slate-500">Active Users</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <UserX size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.suspended}</div>
            <div className="text-[13px] font-medium text-slate-500">Suspended</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <Ban size={24} />
          </div>
          <div>
            <div className="text-[24px] font-bold text-slate-900">{stats.banned}</div>
            <div className="text-[13px] font-medium text-slate-500">Banned</div>
          </div>
        </div>

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
                  <Avatar
                    name={user.fullName || "User"}
                    avatarUrl={user.avatarUrl}
                    size={48}
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
                      <button 
                        onClick={() => { setOpenDropdown(null); navigate(`/profile/${user.id}`); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={16} /> View Profile
                      </button>
                      <button 
                        onClick={() => { setOpenDropdown(null); navigate(`/messages`); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                      >
                        <Mail size={16} /> Send Message
                      </button>
                      {user.isLockedOut ? (
                        <button onClick={() => openModal("unsuspend", user.id, user.fullName || "User")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-green-600 hover:bg-green-50">
                          <CheckCircle2 size={16} /> Unsuspend User
                        </button>
                      ) : (
                        <button onClick={() => openModal("suspend", user.id, user.fullName || "User")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-orange-600 hover:bg-orange-50">
                          <UserX size={16} /> Suspend User
                        </button>
                      )}

                      {user.status === "Banned" ? (
                        <button onClick={() => openModal("unban", user.id, user.fullName || "User")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-green-600 hover:bg-green-50">
                          <CheckCircle2 size={16} /> Unban User
                        </button>
                      ) : (
                        <button onClick={() => openModal("ban", user.id, user.fullName || "User")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50">
                          <Ban size={16} /> Ban User
                        </button>
                      )}
                      <button onClick={() => openModal("admin", user.id, user.fullName || "User")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-blue-600 hover:bg-blue-50">
                        <Shield size={16} /> Make Admin
                      </button>
                      <button onClick={() => openModal("removeAdmin", user.id, user.fullName || "User")} className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-purple-600 hover:bg-purple-50">
                        <Shield size={16} /> Remove Admin
                      </button>
                      <button onClick={() => openModal("delete", user.id, user.fullName || "User")} className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50">
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

      {/* Custom Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{modalTitle}</h3>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="mb-4 text-[14px] text-slate-600">{modalDescription}</p>
            {needsReason && (
              <textarea
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Enter reason..."
                className="mb-4 w-full rounded-xl border border-slate-200 p-3 text-[14px] outline-none focus:border-blue-500 resize-none"
                rows={3}
                autoFocus
              />
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={actionLoading || (needsReason && !modalReason.trim())}
                className={`rounded-xl px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 ${
                  modal.type === "delete" || modal.type === "ban" ? "bg-red-600 hover:bg-red-700" :
                  modal.type === "suspend" ? "bg-orange-600 hover:bg-orange-700" :
                  modal.type === "unban" || modal.type === "unsuspend" ? "bg-green-600 hover:bg-green-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
