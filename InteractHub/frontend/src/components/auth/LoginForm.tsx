// components/auth/LoginForm.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Login page for InteractHub.
// Assembles: TabSwitcher · TextInput · GradientButton ·
//            DemoAccountButton · DemoInfoBanner · Divider
//
// Requirements covered:
//  F1  – component hierarchy with TypeScript interfaces
//  F2  – onLogin callback wired to auth context / API
//  F3  – React Hook Form + client-side validation + error display
//  F4  – Tab routing (Login ↔ Register via onTabChange)
//  B3  – JWT login flow (POST /api/auth/login)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useForm } from "react-hook-form";

// ── Reusable common components ───────────────────────────────────────────────
import TabSwitcher from "../common/TabSwitcher";
import TextInput from "../common/TextInput";
import GradientButton from "../common/GradientButton";
import DemoAccountButton from "../common/DemoAccountButton";
import DemoInfoBanner from "../common/DemoInfoBanner";
import Divider from "../common/Divider";

// ── Icons (local, no extra deps) ─────────────────────────────────────────────
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const AppLogoIcon = () => (
  <div
    style={{
      width: "68px",
      height: "68px",
      borderRadius: "20px",
      background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #7c3aed 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
      margin: "0 auto 20px",
    }}
  >
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  </div>
);

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onLogin?: (data: LoginFormData) => Promise<void>;
  onTabChange?: (tab: "login" | "register") => void;
  onForgotPassword?: () => void;
  onDemoUser?: () => void;
  onDemoAdmin?: () => void;
  isLoading?: boolean;
  serverError?: string;
}

// ── Demo credentials shown in the banner ─────────────────────────────────────
const DEMO_CREDENTIALS = [
  { label: "Admin Demo:", value: "admin@interacthub.com / admin123" },
];

const TAB_OPTIONS = [
  { label: "Login",   value: "login"    },
  { label: "Sign Up", value: "register" },
];

// ── Component ─────────────────────────────────────────────────────────────────
const LoginForm = ({
  onLogin,
  onTabChange,
  onForgotPassword,
  onDemoUser,
  onDemoAdmin,
  isLoading = false,
  serverError,
}: LoginFormProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const handleTabChange = (val: string) => {
    const tab = val as "login" | "register";
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const onSubmit = async (data: LoginFormData) => {
    await onLogin?.(data);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Full-page background */}
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #e0e7ff 0%, #f8faff 40%, #faf5ff 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* App branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <AppLogoIcon />
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 6px",
              letterSpacing: "-0.5px",
            }}
          >
            InteractHub
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#64748b",
              margin: 0,
              fontWeight: 400,
            }}
          >
            Connect with people around the world
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "#ffffff",
            borderRadius: "24px",
            padding: "28px 32px 32px",
            boxShadow: "0 8px 40px rgba(99,102,241,0.10), 0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* ── Tab switcher ── */}
          <TabSwitcher
            options={TAB_OPTIONS}
            value={activeTab}
            onChange={handleTabChange}
            className="mb-6"
          />

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Server-level error */}
              {serverError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#dc2626",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {serverError}
                </div>
              )}

              {/* Email */}
              <TextInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<MailIcon />}
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />

              {/* Password */}
              <TextInput
                label="Password"
                placeholder="Enter your password"
                leftIcon={<LockIcon />}
                showPasswordToggle
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />

              {/* Remember me + Forgot password */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    {...register("rememberMe")}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#6366f1",
                      cursor: "pointer",
                    }}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6366f1",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <GradientButton type="submit" loading={isLoading} style={{ marginTop: "4px" }}>
                Sign In
              </GradientButton>
            </div>
          </form>

          {/* ── Demo accounts section ── */}
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <Divider label="Demo Accounts" />

            <DemoAccountButton
              variant="user"
              label="Try as User"
              onClick={onDemoUser}
            />

            <DemoAccountButton
              variant="admin"
              label="Try as Admin"
              onClick={onDemoAdmin}
            />

            <DemoInfoBanner credentials={DEMO_CREDENTIALS} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;

// ── Preview (remove in production) ───────────────────────────────────────────
export const LoginFormPreview = () => (
  <LoginForm
    onLogin={async (d) => {
      await new Promise((r) => setTimeout(r, 1200));
      console.log("login", d);
    }}
    onTabChange={(t) => console.log("tab →", t)}
    onForgotPassword={() => console.log("forgot password")}
    onDemoUser={() => console.log("demo user")}
    onDemoAdmin={() => console.log("demo admin")}
  />
);
