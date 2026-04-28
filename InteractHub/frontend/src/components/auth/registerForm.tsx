import { useForm } from "react-hook-form";
import TextInput from "../common/TextInput";
import Button from "../common/Button";

const UserIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const MailIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>);
const LockIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>);

export interface RegisterFormData {
  fullName:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
  agreeTerms:      boolean;
}

interface RegisterFormProps {
  onRegister?:  (data: RegisterFormData) => Promise<void>;
  isLoading?:   boolean;
  serverError?: string;
}

export default function RegisterForm({ onRegister, isLoading = false, serverError }: RegisterFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", agreeTerms: false },
  });

  return (
    <form onSubmit={handleSubmit((data) => onRegister?.(data))} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {serverError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", color: "#dc2626", fontSize: "13px", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
            {serverError}
          </div>
        )}

        <TextInput label="Full Name" placeholder="John Doe" leftIcon={<UserIcon />}
          error={errors.fullName?.message}
          {...register("fullName", { required: "Full name is required", minLength: { value: 2, message: "Name must be at least 2 characters" } })} />

        <TextInput label="Email Address" type="email" placeholder="you@example.com" leftIcon={<MailIcon />}
          error={errors.email?.message}
          {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" } })} />

        <TextInput label="Password" placeholder="At least 6 characters" leftIcon={<LockIcon />}
          showPasswordToggle error={errors.password?.message}
          {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })} />

        <TextInput label="Confirm Password" placeholder="Re-enter your password" leftIcon={<LockIcon />}
          showPasswordToggle error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (val) => val === watch("password") || "Passwords do not match",
          })} />

        <div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>
            <input type="checkbox" {...register("agreeTerms", { required: "You must agree to the terms" })}
              style={{ width: "16px", height: "16px", marginTop: "2px", accentColor: "#6366f1", cursor: "pointer", flexShrink: 0 }} />
            <span>
              I agree to the{" "}
              <a href="#" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="#" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</a>
            </span>
          </label>
          {errors.agreeTerms && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontFamily: "'DM Sans', sans-serif" }}>{errors.agreeTerms.message}</p>}
        </div>

        <Button type="submit" loading={isLoading} fullWidth style={{ marginTop: "4px" }}>
          Create Account
        </Button>

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#64748b", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          <strong style={{ color: "#374151" }}>Note:</strong>{" "}
          This is a demo application. All accounts are created locally and no real data is stored.
        </div>
      </div>
    </form>
  );
}