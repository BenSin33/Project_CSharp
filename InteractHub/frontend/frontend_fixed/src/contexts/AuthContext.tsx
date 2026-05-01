import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService, type LoginPayload, type RegisterPayload } from "../services/authService"

export interface AuthUser {
  id: string
  name: string
  email: string
  username: string
  avatarUrl?: string
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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)

  // Khôi phục session và lấy profile từ backend khi có token
  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    if (savedToken) {
      setToken(savedToken)
      // Thử lấy profile mới nhất từ backend
      authService.getMe()
        .then((profile) => {
          setUser(profile)
          localStorage.setItem("user", JSON.stringify(profile))
        })
        .catch(() => {
          // Token hết hạn hoặc lỗi → dùng cached user nếu có
          const savedUser = localStorage.getItem("user")
          if (savedUser) {
            try { setUser(JSON.parse(savedUser)) } catch { /* ignore */ }
          } else {
            // Xóa token không hợp lệ
            localStorage.removeItem("token")
            setToken(null)
          }
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (payload: LoginPayload) => {
    const result = await authService.login(payload)
    localStorage.setItem("token", result.token)
    setToken(result.token)
    // Lấy profile đầy đủ sau khi login
    try {
      const profile = await authService.getMe()
      localStorage.setItem("user", JSON.stringify(profile))
      setUser(profile)
    } catch {
      // fallback dùng user tạm
      localStorage.setItem("user", JSON.stringify(result.user))
      setUser(result.user)
    }
  }

  const register = async (payload: RegisterPayload) => {
    const result = await authService.register(payload)
    // Backend register không auto-login (trả token rỗng) → redirect to login
    // Nếu trả token thì login luôn
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
