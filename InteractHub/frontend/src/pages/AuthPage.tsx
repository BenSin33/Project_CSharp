import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabSwitcher from "../components/common/TabSwitcher";
import LoginForm, { type LoginFormData } from "../components/auth/LoginForm";
import RegisterForm, { type RegisterFormData } from "../components/auth/registerForm";

type Tab = "login" | "register";

const TAB_OPTIONS = [
  { label: "Login",   value: "login"    },
  { label: "Sign Up", value: "register" },
];

const AppLogoIcon = () => (
  <div style={{
    width: "68px", height: "68px", borderRadius: "20px",
    background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #7c3aed 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 24px rgba(99,102,241,0.35)", margin: "0 auto 20px",
  }}>
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  </div>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab]               = useState<Tab>("login");
  const [isLoading, setIsLoading]   = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(undefined);
    try {
        // NOTE (2026-04-27):
        // - Phần này được cập nhật để gọi API backend (Auth).
        // - Gọi POST /api/auth/login và lưu token trả về vào localStorage nếu có.
      const api = (await import("../services/api")).default;
      const resp = await api.post(`/api/auth/login`, { email: data.email, password: data.password });
      if (resp?.data?.token ?? resp?.data?.data?.token) {
        const token = resp.data.token ?? resp.data.data.token;
        localStorage.setItem("token", token);
        navigate("/");
      } else {
        // hiển thị message từ backend nếu có
        setServerError(resp?.data?.message ?? resp?.data?.Message ?? "Login failed");
      }
    } catch {
      setServerError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(undefined);
    try {
      const api = (await import("../services/api")).default;
      // NOTE (2026-04-27):
      // - Gọi POST /api/auth/register. Nếu backend trả token, lưu token và redirect.
      // - Mapping dữ liệu frontend -> DTO backend được thực hiện ở payload dưới.
      const payload = {
        FullName: data.fullName,
        Email: data.email,
        Password: data.password,
        DateOfBirth: new Date().toISOString(),
        Gender: "other",
      };
      const resp = await api.post(`/api/auth/register`, payload);
      if (resp?.data?.success ?? resp?.data?.Success) {
          // auto-login và xử lý response (nếu trả token thì lưu
        const token = resp.data.token ?? resp.data.data?.token;
        if (token) localStorage.setItem("token", token);
        navigate("/");
      } else {
        setServerError(resp?.data?.message ?? resp?.data?.Message ?? "Registration failed");
      }
    } catch {
      setServerError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: "user" | "admin") => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    console.log("demo login:", role);
    setIsLoading(false);
    navigate("/");
  };

  const handleTabChange = (val: string) => {
    setTab(val as Tab);
    setServerError(undefined);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Full-page background */}
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f8faff 40%, #faf5ff 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <AppLogoIcon />
          <h1 style={{
            fontSize: "28px", fontWeight: 800, color: "#0f172a",
            margin: "0 0 6px", letterSpacing: "-0.5px",
          }}>
            InteractHub
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b", margin: 0 }}>
            Connect with people around the world
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", maxWidth: "460px", background: "#ffffff",
          borderRadius: "24px", padding: "28px 32px 32px",
          boxShadow: "0 8px 40px rgba(99,102,241,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        }}>

          {/* Tab switcher — duy nhất 1 chỗ */}
          <TabSwitcher
            options={TAB_OPTIONS}
            value={tab}
            onChange={handleTabChange}
            className="mb-6"
          />

          {/* Form content */}
          {tab === "login" ? (
            <LoginForm
              onLogin={handleLogin}
              onForgotPassword={() => console.log("forgot password")}
              onDemoUser={() => handleDemoLogin("user")}
              onDemoAdmin={() => handleDemoLogin("admin")}
              isLoading={isLoading}
              serverError={serverError}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              isLoading={isLoading}
              serverError={serverError}
            />
          )}
        </div>

        {/* Footer */}
        <p style={{ marginTop: "24px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
          By continuing, you agree to InteractHub's Terms of Service and Privacy Policy
        </p>
      </div>
    </>
  );
}