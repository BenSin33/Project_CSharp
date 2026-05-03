import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService, type LoginPayload, type RegisterPayload } from "../services/authService"

export interface AuthUser {
  id: string
  name: string
  email: string
  username: string
  avatarUrl?: string
  roles?: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Khôi phục session khi app khởi động
  useEffect(() => {
    const savedToken = localStorage.getItem("token")

    if (!savedToken) {
      setIsLoading(false)
      return
    }

    // Có token → set ngay để axios interceptor dùng được
    setToken(savedToken)

    // Dùng cached user ngay lập tức để tránh flash
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch { /* ignore */ }
    }

    // Thử refresh profile từ backend (không block render)
    authService.getMe()
      .then((profile) => {
        setUser(profile)
        localStorage.setItem("user", JSON.stringify(profile))
      })
      .catch((err) => {
        // Nếu 401 → token hết hạn thật sự
        if (err?.response?.status === 401) {
          // Chỉ logout nếu không có cached user (chế độ offline)
          const cached = localStorage.getItem("user")
          if (!cached) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            setToken(null)
            setUser(null)
          }
          // Nếu có cached user → vẫn giữ session, để server request thất bại tự nhiên
        }
        // Lỗi network / 500 → giữ session, dùng cached user
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = async (payload: LoginPayload) => {
    const result = await authService.login(payload)
    localStorage.setItem("token", result.token)
    setToken(result.token)
    try {
      const profile = await authService.getMe()
      localStorage.setItem("user", JSON.stringify(profile))
      setUser(profile)
    } catch {
      localStorage.setItem("user", JSON.stringify(result.user))
      setUser(result.user)
    }
  }

  const register = async (payload: RegisterPayload) => {
    const result = await authService.register(payload)
    if (result.token) {
      localStorage.setItem("token", result.token)
      setToken(result.token)
      try {
        const profile = await authService.getMe()
        localStorage.setItem("user", JSON.stringify(profile))
        setUser(profile)
      } catch {
        localStorage.setItem("user", JSON.stringify(result.user))
        setUser(result.user)
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
