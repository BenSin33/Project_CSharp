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

  // Khôi phục session khi load app
  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (payload: LoginPayload) => {
    const result = await authService.login(payload)
    localStorage.setItem("token", result.token)
    localStorage.setItem("user", JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
  }

  const register = async (payload: RegisterPayload) => {
    const result = await authService.register(payload)
    localStorage.setItem("token", result.token)
    localStorage.setItem("user", JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
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