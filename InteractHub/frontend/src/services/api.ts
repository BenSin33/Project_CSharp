import axios from "axios"

const DEFAULT_BASE = ""

const api = axios.create({
  baseURL: DEFAULT_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: 15_000,
})

// Gắn JWT từ localStorage vào mọi request
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token && config.headers) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }
  return config
})

// Tự logout khi nhận 401 — chống race condition khi nhiều request cùng fail
let isRedirecting = false

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      const isOnAuthPage =
        window.location.pathname.includes("/login") ||
        window.location.pathname.includes("/auth")

      // Không redirect nếu đang ở trang auth, hoặc đang trong quá trình redirect
      if (!isOnAuthPage && !isRedirecting) {
        const token = localStorage.getItem("token")
        if (token) {
          isRedirecting = true
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          // Dùng timeout nhỏ để các request đang chạy kịp reject trước khi redirect
          setTimeout(() => {
            window.location.href = "/login"
            isRedirecting = false
          }, 100)
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

/**
 * Unwrap dữ liệu thực từ ApiResponse<T> của backend.
 * Backend trả: { success, message, data } hoặc trực tiếp object.
 */
export function unwrap<T>(resp: any): T | undefined {
  if (resp?.data?.data !== undefined) return resp.data.data as T
  if (resp?.data !== undefined) return resp.data as T
  return undefined
}