import api from "./api"
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
  dateOfBirth?: string
  gender?: number
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

async function login(payload: LoginPayload): Promise<AuthResponse> {
  const resp = await api.post("/api/auth/login", {
    email: payload.email,
    password: payload.password,
  })
  const data = resp.data

  if (!data?.success || !data?.token) {
    throw new Error(data?.message ?? "Login failed")
  }

  // Lưu token vào localStorage TRƯỚC khi gọi getMe
  localStorage.setItem("token", data.token)

  // Lấy profile đầy đủ
  let user: AuthUser
  try {
    user = await getMe()
  } catch {
    user = {
      id: "",
      name: payload.email.split("@")[0],
      email: payload.email,
      username: payload.email.split("@")[0],
    }
  }

  localStorage.setItem("user", JSON.stringify(user))
  return { token: data.token, user }
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const resp = await api.post("/api/auth/register", {
    FullName: payload.fullName,
    Email: payload.email,
    Password: payload.password,
    DateOfBirth: payload.dateOfBirth ?? new Date(2000, 0, 1).toISOString(),
    Gender: payload.gender ?? 2,
  })
  const data = resp.data

  if (!data?.success) {
    throw new Error(data?.message ?? "Registration failed")
  }

  // Backend register không trả token, chỉ trả success
  return {
    token: "",
    user: {
      id: "",
      name: payload.fullName,
      email: payload.email,
      username: payload.email.split("@")[0],
    },
  }
}

async function getMe(): Promise<AuthUser> {
  const resp = await api.get("/api/auth/profile")
  const d = resp.data
  return {
    id: String(d?.id ?? d?.Id ?? ""),
    name: d?.fullName ?? d?.FullName ?? d?.email ?? "",
    email: d?.email ?? d?.Email ?? "",
    username: (d?.email ?? "").split("@")[0],
    avatarUrl: d?.avatarUrl ?? d?.AvatarUrl,
  }
}

export const authService = { login, register, getMe }
