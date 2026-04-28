import api, { unwrap } from "./api"
import type { AuthUser } from "../contexts/AuthContext"

export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

// Mock fallback — dùng khi backend chưa sẵn sàng
const MOCK_USER: AuthUser = {
  id: "demo-1",
  name: "Alex Kim",
  email: "demo@user.com",
  username: "alexkim",
  avatarUrl: undefined,
}

async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const resp = await api.post("/api/auth/login", payload)
    const data = unwrap<AuthResponse>(resp)
    if (data) return data
    throw new Error("Empty response")
  } catch (err: any) {
    // Fallback demo mode khi backend down
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) {
      console.warn("[authService] Backend unavailable, using demo fallback")
      return { token: "demo-token", user: MOCK_USER }
    }
    throw err
  }
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const resp = await api.post("/api/auth/register", payload)
    const data = unwrap<AuthResponse>(resp)
    if (data) return data
    throw new Error("Empty response")
  } catch (err: any) {
    if (err?.code === "ERR_NETWORK" || err?.response?.status >= 500) {
      console.warn("[authService] Backend unavailable, using demo fallback")
      const newUser: AuthUser = {
        id: "new-" + Date.now(),
        name: payload.fullName,
        email: payload.email,
        username: payload.email.split("@")[0],
      }
      return { token: "demo-token", user: newUser }
    }
    throw err
  }
}

async function getMe(): Promise<AuthUser> {
  const resp = await api.get("/api/auth/profile")
  return unwrap<AuthUser>(resp)!
}

export const authService = { login, register, getMe }