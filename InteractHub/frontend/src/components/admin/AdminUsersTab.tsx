import { useState, useCallback } from "react"
import { Users, Ban, Clock, Trash2, Lock } from "lucide-react"
import { adminService, type AdminUserItem } from "../../services/adminService"

interface AdminUsersTabProps {
  users: AdminUserItem[]
  loading: boolean
  actionLoading: string | null
  onRefresh: () => Promise<void>
}

function userStatusStyle(status?: string) {
  const normalized = (status ?? "").toLowerCase()
  if (normalized === "banned") return "bg-red-50 text-red-700 border-red-200"
  if (normalized === "suspended") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-emerald-50 text-emerald-700 border-emerald-200"
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("vi-VN")
}

export default function AdminUsersTab({ users, loading, onRefresh }: AdminUsersTabProps) {
  const [internalActionLoading, setInternalActionLoading] = useState<string | null>(null)

  const banUser = useCallback(async (userId: string) => {
    const reason = window.prompt("Nhập lý do cấm người dùng", "Vi phạm chính sách cộng đồng")
    if (!reason) return

    setInternalActionLoading(`ban-${userId}`)
    try {
      await adminService.banUser(userId, reason)
      await onRefresh()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể cấm người dùng.")
    } finally {
      setInternalActionLoading(null)
    }
  }, [onRefresh])

  const unbanUser = useCallback(async (userId: string) => {
    if (!window.confirm("Bạn chắc chắn muốn gỡ cấm người dùng này?")) return

    setInternalActionLoading(`unban-${userId}`)
    try {
      await adminService.unbanUser(userId)
      await onRefresh()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể gỡ cấm người dùng.")
    } finally {
      setInternalActionLoading(null)
    }
  }, [onRefresh])

  const suspendUser = useCallback(async (userId: string) => {
    const daysStr = window.prompt("Nhập số ngày tạm khóa (1-365)", "7")
    if (!daysStr) return

    const days = parseInt(daysStr)
    if (isNaN(days) || days < 1 || days > 365) {
      alert("Số ngày phải từ 1 đến 365")
      return
    }

    const reason = window.prompt("Nhập lý do tạm khóa", "Vi phạm chính sách cộng đồng")
    if (!reason) return

    setInternalActionLoading(`suspend-${userId}`)
    try {
      await adminService.suspendUser(userId, days, reason)
      await onRefresh()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể tạm khóa người dùng.")
    } finally {
      setInternalActionLoading(null)
    }
  }, [onRefresh])

  const unsuspendUser = useCallback(async (userId: string) => {
    if (!window.confirm("Bạn chắc chắn muốn gỡ tạm khóa người dùng này?")) return

    setInternalActionLoading(`unsuspend-${userId}`)
    try {
      await adminService.unsuspendUser(userId)
      await onRefresh()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể gỡ tạm khóa người dùng.")
    } finally {
      setInternalActionLoading(null)
    }
  }, [onRefresh])

  const deleteUserPermanently = useCallback(async (userId: string, userName?: string) => {
    const confirmText = window.prompt(
      `XÁC NHẬN: Nhập tên người dùng "${userName}" để xóa vĩnh viễn.\n\n⚠️ CẢNH BÁO: Hành động này KHÔNG THỂ HOÀN TÁC!`,
      ""
    )
    if (confirmText !== userName) {
      alert("Không xác nhận đúng. Hành động bị hủy.")
      return
    }

    setInternalActionLoading(`delete-${userId}`)
    try {
      await adminService.deleteUserPermanently(userId)
      await onRefresh()
      alert("Người dùng đã được xóa vĩnh viễn.")
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Không thể xóa người dùng.")
    } finally {
      setInternalActionLoading(null)
    }
  }, [onRefresh])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Quản lý người dùng</h2>
        <p className="mt-1 text-sm text-slate-500">Cấm, tạm khóa hoặc xóa tài khoản người dùng</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-medium">Người dùng</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    Không có người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                            <Users size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{user.fullName}</div>
                          <div className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <a href={`mailto:${user.email}`} className="text-slate-600 hover:underline">
                        {user.email}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${userStatusStyle(user.status)}`}>
                          {user.status || "Active"}
                        </span>
                        {user.status === "Suspended" && user.suspendedUntil ? (
                          <span className="text-xs text-slate-500">
                            Đến {new Date(user.suspendedUntil).toLocaleDateString("vi-VN")}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {user.status !== "Banned" ? (
                          <button
                            onClick={() => banUser(user.id)}
                            disabled={internalActionLoading?.startsWith("ban-") || internalActionLoading?.startsWith("suspend-")}
                            title="Cấm người dùng này"
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Ban size={14} /> Ban
                          </button>
                        ) : (
                          <button
                            onClick={() => unbanUser(user.id)}
                            disabled={internalActionLoading?.startsWith("unban-")}
                            title="Gỡ cấm người dùng"
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Lock size={14} /> Unban
                          </button>
                        )}

                        {user.status !== "Suspended" && user.status !== "Banned" ? (
                          <button
                            onClick={() => suspendUser(user.id)}
                            disabled={internalActionLoading?.startsWith("suspend-") || internalActionLoading?.startsWith("ban-")}
                            title="Tạm khóa tài khoản"
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Clock size={14} /> Suspend
                          </button>
                        ) : user.status === "Suspended" ? (
                          <button
                            onClick={() => unsuspendUser(user.id)}
                            disabled={internalActionLoading?.startsWith("unsuspend-")}
                            title="Gỡ tạm khóa"
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Lock size={14} /> Unsuspend
                          </button>
                        ) : null}

                        <button
                          onClick={() => deleteUserPermanently(user.id, user.fullName)}
                          disabled={internalActionLoading?.startsWith("delete-")}
                          title="Xóa vĩnh viễn (KHÔNG THỂ HOÀN TÁC)"
                          className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
