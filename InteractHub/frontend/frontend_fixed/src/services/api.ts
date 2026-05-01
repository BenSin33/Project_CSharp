import axios from "axios"

// Backend .NET chạy ở port 5073 (HTTP) hoặc 7073 (HTTPS)
// Vite proxy /api/* -> http://localhost:5073 khi dev
// Production: đặt VITE_API_URL=https://your-domain.com
const DEFAULT_BASE = import.meta.env.VITE_API_URL ?? ""

const api = axios.create({
  baseURL: DEFAULT_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,   // JWT qua Authorization header, không dùng cookie
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

// Tự logout khi nhận 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
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
  // ApiResponse<T> wrapper
  if (resp?.data?.data !== undefined) return resp.data.data as T
  // Direct response
  if (resp?.data !== undefined) return resp.data as T
  return undefined
}
