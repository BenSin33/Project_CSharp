/*
  NOTE (2026-04-27):
  - File này được thêm / chỉnh sửa ngày 27/04/2026 để cung cấp HTTP client chung
    cho frontend.
  - Chức năng: axios instance, gắn token từ localStorage, và helper `unwrap` để
    tương thích với `ApiResponse<T>` của backend.
*/
import axios from "axios";
const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5073";

const api = axios.create({
  baseURL: DEFAULT_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor gắn token JWT từ localStorage vào header Authorization nếu có.
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && config.headers) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default api;

// unwrap nhận response axios và trả về payload thực (hỗ trợ ApiResponse<T> của backend)
export function unwrap<T>(resp: any): T | undefined {
  return resp?.data?.data ?? resp?.data;
}
