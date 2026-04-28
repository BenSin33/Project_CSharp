import axios from "axios"

const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5073"

const api = axios.create({
  baseURL: DEFAULT_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10_000,
})

// Gắn JWT từ localStorage
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token && config.headers) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }
  return config
})

// Tự logout khi 401
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

/** Lấy payload thực từ ApiResponse<T> của backend */
export function unwrap<T>(resp: any): T | undefined {
  return resp?.data?.data ?? resp?.data
}