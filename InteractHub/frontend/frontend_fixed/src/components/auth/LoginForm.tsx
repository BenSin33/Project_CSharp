import { useForm } from "react-hook-form";
import TextInput from "../common/TextInput";
import Button from "../common/Button";
import Divider from "../common/Divider";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LoginFormData {
  email:      string;
  password:   string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onLogin?:           (data: LoginFormData) => Promise<void>;
  onForgotPassword?:  () => void;
  onDemoUser?:        () => void;
  onDemoAdmin?:       () => void;
  isLoading?:         boolean;
  serverError?:       string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const DEMO_CREDENTIALS = [
  { label: "Admin Demo:", value: "admin@interacthub.com / admin123" },
];

// ─── LoginForm ────────────────────────────────────────────────────────────────
export default function LoginForm({
  onLogin,
  onForgotPassword,
  onDemoUser,
  onDemoAdmin,
  isLoading   = false,
  serverError,
}: LoginFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <form onSubmit={handleSubmit((data) => onLogin?.(data))} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {serverError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", color: "#dc2626", fontSize: "13px", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
              {serverError}
            </div>
          )}

          <TextInput label="Email Address" type="email" placeholder="you@example.com" leftIcon={<MailIcon />}
            error={errors.email?.message}
            {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" } })} />

          <TextInput label="Password" placeholder="Enter your password" leftIcon={<LockIcon />}
            showPasswordToggle error={errors.password?.message}
            {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500, color: "#374151", userSelect: "none", fontFamily: "'DM Sans', sans-serif" }}>
              <input type="checkbox" {...register("rememberMe")} style={{ width: "16px", height: "16px", accentColor: "#6366f1", cursor: "pointer" }} />
              Remember me
            </label>
            <button type="button" onClick={onForgotPassword}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "14px", fontWeight: 600, padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Forgot password?
            </button>
          </div>

          <Button type="submit" loading={isLoading} fullWidth style={{ marginTop: "4px" }}>
            Sign In
          </Button>
        </div>
      </form>

      {/* Demo accounts */}
      <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <Divider label="Demo Accounts" />
        <DemoButton icon={<UserIcon />}   label="Try as User"  color="#374151" border="#d1d5db" hoverBg="#f9fafb"  onClick={onDemoUser}  />
        <DemoButton icon={<ShieldIcon />} label="Try as Admin" color="#ea580c" border="#f97316" hoverBg="#fff7ed" onClick={onDemoAdmin} />
        <DemoInfoBanner credentials={DEMO_CREDENTIALS} />
      </div>
    </div>
  );
}

// ─── DemoButton (internal) ───────────────────────────────────────────────────
function DemoButton({ icon, label, color, border, hoverBg, onClick }: {
  icon: React.ReactNode; label: string; color: string; border: string; hoverBg: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "13px 0", borderRadius: "12px", background: "#fff", border: `1.5px solid ${border}`, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 600, color, transition: "background 0.15s, transform 0.12s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
      onMouseDown={(e)  => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
      onMouseUp={(e)    => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── DemoInfoBanner ──────────────────────────────────────────────────────────
interface Credential { label: string; value: string; }

export function DemoInfoBanner({ credentials }: { credentials: Credential[] }) {
  return (
    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
      {credentials.map((cred) => (
        <p key={cred.label} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#1e40af", margin: 0 }}>
          <strong style={{ fontWeight: 700 }}>{cred.label}</strong>{" "}
          <span style={{ fontWeight: 400, color: "#3b82f6" }}>{cred.value}</span>
        </p>
      ))}
    </div>
  );
}