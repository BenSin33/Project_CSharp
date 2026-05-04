import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabSwitcher from "../components/common/TabSwitcher";
import LoginForm, { type LoginFormData } from "../components/auth/LoginForm";
import RegisterForm, { type RegisterFormData } from "../components/auth/registerForm";
import { useAuth } from "../contexts/AuthContext";

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
  const { login, register } = useAuth();
  const [tab, setTab]               = useState<Tab>("login");
  const [isLoading, setIsLoading]   = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();
  const [successMsg, setSuccessMsg]  = useState<string | undefined>();

  const toFriendlyAuthError = (err: any, fallback: string) => {
    const status = err?.response?.status;
    if (status === 502) {
      return "Không thể kết nối API (502 Bad Gateway). Hãy kiểm tra backend hoặc cấu hình proxy.";
    }
    if (!err?.response && err?.message === "Network Error") {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy.";
    }
    return err?.response?.data?.message ?? err?.message ?? fallback;
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(undefined);
    setSuccessMsg(undefined);
    try {
      // Dùng AuthContext.login → token được lưu vào cả localStorage VÀ React state
      // → các API call sau đó sẽ có token hợp lệ
      await login({ email: data.email, password: data.password });
      const cachedUser = localStorage.getItem("user");
      let isAdmin = false;
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          isAdmin = Array.isArray(parsed?.roles) && parsed.roles.includes("Admin");
        } catch {
          isAdmin = false;
        }
      }
      navigate(isAdmin ? "/admin" : "/");
    } catch (err: any) {
      const msg = toFriendlyAuthError(err, "Email hoặc mật khẩu không đúng.");
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(undefined);
    setSuccessMsg(undefined);
    try {
      await register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString()
          : new Date(2000, 0, 1).toISOString(),
        gender: parseInt(data.gender ?? "2", 10),
      });
      // Nếu backend trả token → AuthContext đã login, navigate luôn
      // Nếu không → chuyển về tab login
      setTab("login");
      setSuccessMsg("Đăng ký thành công! Vui lòng đăng nhập.");
    } catch (err: any) {
      const msg = toFriendlyAuthError(err, "Đăng ký thất bại. Vui lòng thử lại.");
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: "user" | "admin") => {
    setIsLoading(true);
    setServerError(undefined);
    const email    = role === "admin" ? "admin@interacthub.com" : "user@interacthub.com";
    const password = role === "admin" ? "Admin@123" : "User@123";
    try {
      await login({ email, password });
      const cachedUser = localStorage.getItem("user");
      let isAdmin = false;
      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          isAdmin = Array.isArray(parsed?.roles) && parsed.roles.includes("Admin");
        } catch {
          isAdmin = false;
        }
      }
      navigate(isAdmin ? "/admin" : "/");
    } catch (err: any) {
      const msg = toFriendlyAuthError(err, "Đăng nhập demo thất bại. Vui lòng kiểm tra backend/API.");
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (val: string) => {
    setTab(val as Tab);
    setServerError(undefined);
    setSuccessMsg(undefined);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f8faff 40%, #faf5ff 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <AppLogoIcon />
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            InteractHub
          </h1>
          <p style={{ fontSize: "15px", color: "#64748b", margin: 0 }}>
            Connect with people around the world
          </p>
        </div>

        <div style={{
          width: "100%", maxWidth: "460px", background: "#ffffff",
          borderRadius: "24px", padding: "28px 32px 32px",
          boxShadow: "0 8px 40px rgba(99,102,241,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <TabSwitcher options={TAB_OPTIONS} value={tab} onChange={handleTabChange} className="mb-6" />

          {successMsg && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 14px", color: "#16a34a", fontSize: "13px", fontWeight: 500, fontFamily: "'DM Sans', sans-serif", marginBottom: "12px" }}>
              {successMsg}
            </div>
          )}

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

        <p style={{ marginTop: "24px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
          By continuing, you agree to InteractHub's Terms of Service and Privacy Policy
        </p>
      </div>
    </>
  );
}
