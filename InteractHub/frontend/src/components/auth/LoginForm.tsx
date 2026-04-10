import { useForm } from "react-hook-form";
import TextInput from "../common/TextInput";
import GradientButton from "../common/GradientButton";
import DemoAccountButton from "./DemoAccountButton";
import DemoInfoBanner from "../DemoInfoBanner";
import Divider from "../common/Divider";

// ── Icons ─────────────────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onLogin?: (data: LoginFormData) => Promise<void>;
  onForgotPassword?: () => void;
  onDemoUser?: () => void;
  onDemoAdmin?: () => void;
  isLoading?: boolean;
  serverError?: string;
}

const DEMO_CREDENTIALS = [
  { label: "Admin Demo:", value: "admin@interacthub.com / admin123" },
];

// ── Component ─────────────────────────────────────────────────────────────────
// LoginForm chỉ render FORM CONTENT — không có background/branding/card
// Layout bên ngoài do AuthPage quản lý
const LoginForm = ({
  onLogin,
  onForgotPassword,
  onDemoUser,
  onDemoAdmin,
  isLoading = false,
  serverError,
}: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    await onLogin?.(data);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Server error */}
          {serverError && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "10px", padding: "10px 14px",
              color: "#dc2626", fontSize: "13px", fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
            }}>
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
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
          />

          {/* Remember me + Forgot password */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: "8px",
              cursor: "pointer", fontSize: "14px", fontWeight: 500,
              color: "#374151", userSelect: "none",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <input
                type="checkbox"
                {...register("rememberMe")}
                style={{ width: "16px", height: "16px", accentColor: "#6366f1", cursor: "pointer" }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6366f1", fontSize: "14px", fontWeight: 600,
                padding: 0, fontFamily: "'DM Sans', sans-serif",
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

      {/* ── Demo accounts ── */}
      <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <Divider label="Demo Accounts" />
        <DemoAccountButton variant="user"  label="Try as User"  onClick={onDemoUser}  />
        <DemoAccountButton variant="admin" label="Try as Admin" onClick={onDemoAdmin} />
        <DemoInfoBanner credentials={DEMO_CREDENTIALS} />
      </div>
    </div>
  );
};

export default LoginForm;