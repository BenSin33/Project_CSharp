import api, { unwrap } from "./api"

export type ReportStatus = "Pending" | "Reviewed" | "Resolved"

export interface DashboardStats {
  totalUsers?: number
  newUsersThisMonth?: number
  activeUsersThisMonth?: number
  lockedUsers?: number

  totalPosts?: number
  newPostsThisMonth?: number
  deletedPosts?: number
  hiddenPosts?: number

  pendingReports?: number
  reviewedReports?: number
  resolvedReports?: number
  totalReports?: number

  totalComments?: number
  totalLikes?: number
  totalShares?: number

  generatedAt?: string
}

export interface RecentActivity {
  id?: string
  type?: string
  description?: string
  timestamp?: string
  relatedUserIds?: string[]
  relatedPostIds?: string[]
}

export interface PendingAction {
  actionType?: string
  priority?: number
  title?: string
  description?: string
}

export interface AdminTopUserItem {
  id: string
  fullName: string
  avatarUrl?: string
  postCount: number
  friendCount: number
  status: string
}

export interface AdminDashboard {
  stats?: DashboardStats
  recentActivity?: RecentActivity[]
  pendingActions?: PendingAction[]
  topUsers?: AdminTopUserItem[]
}

export interface AdminReportAuthor {
  id?: string
  fullName?: string
  name?: string
  email?: string
}

export interface AdminReportPost {
  id?: string
  content?: string
  author?: AdminReportAuthor
}

export interface AdminReportItem {
  id: string
  postId?: string
  reason?: string
  reportType?: string
  status?: string
  adminNotes?: string
  createdAt?: string
  reporter?: AdminReportAuthor
  post?: AdminReportPost
}

export interface AdminReportsResponse {
  data: AdminReportItem[]
  total: number
  skip: number
  take: number
  totalPages?: number
  hasNextPage?: boolean
  pendingCount?: number
  reviewedCount?: number
  resolvedCount?: number
}

export interface AdminPostAuthor {
  id?: string
  fullName?: string
  name?: string
  email?: string
  avatarUrl?: string
}

export interface AdminPostItem {
  id: string
  content?: string
  status?: string
  visibility?: string
  reportCount?: number
  commentCount?: number
  likeCount?: number
  shareCount?: number
  createdAt?: string
  updatedAt?: string
  author?: AdminPostAuthor
  reportReasons?: string[]
}

export interface AdminUserItem {
  id: string
  email?: string
  fullName?: string
  avatarUrl?: string
  bio?: string
  location?: string
  roles?: string[]
  isLockedOut?: boolean
  status?: string
  suspendedUntil?: string
  createdAt?: string
  bannedAt?: string
  banReason?: string
}

export interface ActivityLogItem {
  id: string
  adminId: string
  adminName: string
  adminEmail: string
  action: string
  actionCategory: string
  severity: string
  targetUserId?: string
  targetUserName?: string
  targetUserEmail?: string
  targetPostId?: string
  targetReportId?: string
  reason?: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  createdAt: string
  admin?: {
    id: string
    fullName?: string
    name?: string
    email?: string
  }
  targetUser?: {
    id: string
    fullName?: string
    email?: string
  }
}

export interface ActivityLogResponse {
  data: ActivityLogItem[]
  total: number
  skip: number
  take: number
}

export interface ActivityLogStats {
  totalLogs: number
  criticalLogs: number
  warningLogs: number
  userActionLogs: number
  postActionLogs: number
  reportActionLogs: number
  actionCategory?: Record<string, number>
}

export interface UpdateReportStatusPayload {
  status: ReportStatus | string
  adminNotes?: string
}

export interface AdminDeletePostPayload {
  reason: string
  adminNotes?: string
}

export interface UpdatePostVisibilityPayload {
  newVisibility: string
  adminNotes?: string
}

export interface UpdatePostStatusPayload {
  newStatus: string
  reason?: string
  adminNotes?: string
}

export interface AssignRolePayload {
  roleName: string
}

function unwrapList<T>(resp: unknown): T {
  const raw = unwrap<T>(resp as any)
  return raw ?? (resp as any)?.data ?? ({} as T)
}

async function getDashboard(): Promise<AdminDashboard> {
  const resp = await api.get("/api/admin/dashboard")
  return unwrapList<AdminDashboard>(resp)
}

async function getRecentActivities(count = 10): Promise<RecentActivity[]> {
  const resp = await api.get("/api/admin/dashboard/recent-activity", { params: { count } })
  return unwrapList<RecentActivity[]>(resp) ?? []
}

async function getPendingActions(): Promise<PendingAction[]> {
  const resp = await api.get("/api/admin/dashboard/pending-actions")
  return unwrapList<PendingAction[]>(resp) ?? []
}

async function getReports(skip = 0, take = 10, status?: ReportStatus | "all"): Promise<AdminReportsResponse> {
  const params: Record<string, unknown> = { skip, take }
  if (status && status !== "all") params.status = status
  const resp = await api.get("/api/report", { params })
  // Backend returns ReportsListResponseDTO with shape { Reports: ReportResponseDTO[], Total, Skip, Take, ... }
  const raw = unwrap<any>(resp) ?? resp.data
  const dto = raw ?? {}
  const reportsArray = Array.isArray(dto?.Reports) ? dto.Reports : (Array.isArray(dto?.reports) ? dto.reports : [])

  const mapped: AdminReportsResponse = {
    data: reportsArray.map((r: any) => {
      const statusMapRev: Record<string, string> = { "0": "Pending", "1": "Reviewed", "2": "Resolved", "Pending": "Pending", "Reviewed": "Reviewed", "Resolved": "Resolved" }
      const statusStr = r.status?.toString?.() ?? String(r.status ?? "")
      const mappedStatus = statusMapRev[statusStr] ?? statusStr

      return {
      id: r.id,
      postId: r.postId,
      reason: r.reason,
      reportType: r.reportType?.toString?.() ?? String(r.reportType ?? ""),
      status: mappedStatus,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt,
      reporter: r.reporterId
        ? {
            id: r.reporterId,
            fullName: r.reporterName,
            name: r.reporterName,
            email: r.reporterEmail,
          }
        : r.reporter
        ? {
            id: r.reporter.id,
            fullName: r.reporter.fullName ?? r.reporter.name,
            name: r.reporter.name ?? r.reporter.fullName,
            email: r.reporter.email,
          }
        : undefined,
      post: r.postId
        ? {
            id: r.postId,
            content: r.postContent,
            author: {
              id: r.postAuthorId,
              fullName: r.postAuthorName,
              name: r.postAuthorName,
              email: undefined,
            },
          }
        : r.post
        ? {
            id: r.post.id,
            content: r.post.content,
          }
        : undefined,
      }
    }),
    total: dto?.Total ?? dto?.total ?? 0,
    skip: dto?.Skip ?? dto?.skip ?? skip,
    take: dto?.Take ?? dto?.take ?? take,
    pendingCount: dto?.Pending ?? dto?.pending ?? undefined,
    reviewedCount: dto?.Reviewed ?? dto?.reviewed ?? undefined,
    resolvedCount: dto?.Resolved ?? dto?.resolved ?? undefined,
  }

  return mapped
}

async function getAllPosts(skip = 0, take = 20): Promise<AdminPostItem[]> {
  const resp = await api.get("/api/admin/posts", { params: { skip, take } })
  const raw = unwrapList<any>(resp)
  const data = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []
  
  return data.map((p: any) => ({
    ...p,
    author: {
      id: p.authorId,
      name: p.authorName,
      fullName: p.authorName,
      email: p.authorEmail,
      avatarUrl: p.authorAvatarUrl
    }
  }))
}

async function updateReportStatus(reportId: string, payload: UpdateReportStatusPayload): Promise<boolean> {
  const statusMap: Record<string, number> = { "Pending": 0, "Reviewed": 1, "Resolved": 2 }
  const statusVal = typeof payload.status === "string" ? statusMap[payload.status] ?? 0 : payload.status
  const resp = await api.put(`/api/report/${reportId}/status`, {
    status: statusVal,
    adminNotes: payload.adminNotes,
  })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function getReportedPosts(skip = 0, take = 10): Promise<AdminPostItem[]> {
  const resp = await api.get("/api/admin/posts/reported", { params: { skip, take } })
  const raw = unwrapList<any>(resp)
  return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []
}

async function getPostsPendingReview(): Promise<AdminPostItem[]> {
  const resp = await api.get("/api/admin/posts/pending-review")
  const raw = unwrapList<any>(resp)
  return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
}

async function getUsers(): Promise<AdminUserItem[]> {
  const resp = await api.get("/api/user")
  const raw = unwrapList<any>(resp)
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

async function searchUsers(query: string, skip = 0, take = 20): Promise<AdminUserItem[]> {
  const resp = await api.get("/api/user/search", { params: { q: query, skip, take } })
  const raw = unwrapList<any>(resp)
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw)) return raw
  return []
}

async function lockUser(userId: string, days = 7): Promise<boolean> {
  const resp = await api.post(`/api/user/${userId}/lock`, days, {
    headers: { "Content-Type": "application/json" },
  })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function unlockUser(userId: string): Promise<boolean> {
  const resp = await api.post(`/api/user/${userId}/unlock`)
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function assignRole(userId: string, roleName: string): Promise<boolean> {
  const resp = await api.post(`/api/user/${userId}/roles`, { roleName })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function removeRole(userId: string, roleName: string): Promise<boolean> {
  const resp = await api.delete(`/api/user/${userId}/roles`, { params: { roleName } })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function hidePost(postId: string, reason: string): Promise<boolean> {
  const resp = await api.post(`/api/admin/posts/${postId}/hide`, JSON.stringify(reason), {
    headers: { "Content-Type": "application/json" },
  })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function unhidePost(postId: string): Promise<boolean> {
  const resp = await api.post(`/api/admin/posts/${postId}/unhide`)
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function deletePost(postId: string, payload: AdminDeletePostPayload): Promise<boolean> {
  const resp = await api.delete(`/api/admin/posts/${postId}`, { params: payload })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function updatePostVisibility(postId: string, payload: UpdatePostVisibilityPayload): Promise<boolean> {
  const resp = await api.put(`/api/admin/posts/${postId}/visibility`, payload)
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function updatePostStatus(postId: string, payload: UpdatePostStatusPayload): Promise<boolean> {
  const resp = await api.put(`/api/admin/posts/${postId}/status`, payload)
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function getActivityLogs(
  skip = 0,
  take = 20,
  category?: string,
  action?: string,
  severity?: string
): Promise<ActivityLogResponse> {
  const params: Record<string, unknown> = { skip, take }
  if (category) params.category = category
  if (action) params.action = action
  if (severity) params.severity = severity
  const resp = await api.get("/api/admin/activity-logs", { params })
  return unwrapList<ActivityLogResponse>(resp)
}

async function getActivityStats(): Promise<ActivityLogStats> {
  const resp = await api.get("/api/admin/activity-logs/stats")
  return unwrapList<ActivityLogStats>(resp)
}

async function getUserActivityLogs(userId: string, take = 10): Promise<ActivityLogItem[]> {
  const resp = await api.get(`/api/admin/activity-logs/user/${userId}`, { params: { take } })
  const raw = unwrapList<any>(resp)
  return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
}

async function banUser(userId: string, reason: string): Promise<boolean> {
  const resp = await api.post(`/api/user/${userId}/ban`, { reason })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function unbanUser(userId: string): Promise<boolean> {
  const resp = await api.post(`/api/user/${userId}/unban`)
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function suspendUser(userId: string, daysUntilExpiry: number, reason: string): Promise<boolean> {
  const resp = await api.post(`/api/user/${userId}/suspend`, { daysUntilExpiry, reason })
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function unsuspendUser(userId: string): Promise<boolean> {
  const resp = await api.post(`/api/user/${userId}/unsuspend`)
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

async function deleteUserPermanently(userId: string): Promise<boolean> {
  const resp = await api.delete(`/api/user/${userId}/permanent`)
  const raw = unwrap<any>(resp)
  return raw?.success ?? resp.data?.success ?? true
}

export const adminService = {
  getDashboard,
  getRecentActivities,
  getPendingActions,
  getReports,
  updateReportStatus,
  getReportedPosts,
  getPostsPendingReview,
  getAllPosts,
  getUsers,
  searchUsers,
  lockUser,
  unlockUser,
  assignRole,
  removeRole,
  hidePost,
  unhidePost,
  deletePost,
  updatePostVisibility,
  updatePostStatus,
  getActivityLogs,
  getActivityStats,
  getUserActivityLogs,
  banUser,
  unbanUser,
  suspendUser,
  unsuspendUser,
  deleteUserPermanently,
}
