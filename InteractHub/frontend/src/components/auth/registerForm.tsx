import { useForm } from "react-hook-form";
import TextInput from "../common/TextInput";
import Button from "../common/Button";

const UserIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const MailIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>);
const LockIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>);
const CalendarIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>);

export interface RegisterFormData {
  fullName:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
  dateOfBirth:     string;
  gender:          string;
  agreeTerms:      boolean;
}

interface RegisterFormProps {
  onRegister?:  (data: RegisterFormData) => Promise<void>;
  isLoading?:   boolean;
  serverError?: string;
}

export default function RegisterForm({ onRegister, isLoading = false, serverError }: RegisterFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: "", email: "", password: "", confirmPassword: "",
      dateOfBirth: "", gender: "2", agreeTerms: false,
    },
  });

  // Tính ngày max hợp lệ (phải >= 13 tuổi)
  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split("T")[0];
  })();

  return (
    <form onSubmit={handleSubmit((data) => onRegister?.(data))} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {serverError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", color: "#dc2626", fontSize: "13px", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
            {serverError}
          </div>
        )}

        {/* Họ tên */}
        <TextInput label="Họ và tên" placeholder="Nguyễn Văn A" leftIcon={<UserIcon />}
          error={errors.fullName?.message}
          {...register("fullName", {
            required: "Họ tên là bắt buộc",
            minLength: { value: 2, message: "Tên phải có ít nhất 2 ký tự" },
            maxLength: { value: 100, message: "Tên không được vượt quá 100 ký tự" },
            pattern: { value: /^[^\d<>{}[\]\\|;:'"!@#$%^&*()_+=]*$/, message: "Tên không chứa ký tự đặc biệt hoặc số" },
          })} />

        {/* Email */}
        <TextInput label="Địa chỉ Email" type="email" placeholder="you@example.com" leftIcon={<MailIcon />}
          error={errors.email?.message}
          {...register("email", {
            required: "Email là bắt buộc",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Vui lòng nhập email hợp lệ" },
            maxLength: { value: 256, message: "Email không được vượt quá 256 ký tự" },
          })} />

        {/* Mật khẩu — khớp backend: >= 8 ký tự, uppercase, digit, special */}
        <TextInput label="Mật khẩu" placeholder="Ít nhất 8 ký tự, chữ hoa, số, ký tự đặc biệt" leftIcon={<LockIcon />}
          showPasswordToggle error={errors.password?.message}
          {...register("password", {
            required: "Mật khẩu là bắt buộc",
            minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
            validate: {
              hasUppercase: (v) => /[A-Z]/.test(v)        || "Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)",
              hasDigit:     (v) => /\d/.test(v)            || "Mật khẩu phải có ít nhất 1 chữ số (0-9)",
              hasSpecial:   (v) => /[^A-Za-z0-9]/.test(v) || "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$...)",
            },
          })} />

        {/* Xác nhận mật khẩu */}
        <TextInput label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" leftIcon={<LockIcon />}
          showPasswordToggle error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Vui lòng xác nhận mật khẩu",
            validate: (val) => val === watch("password") || "Mật khẩu không khớp",
          })} />

        {/* Ngày sinh */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <CalendarIcon /> Ngày sinh
            </span>
            <input
              type="date"
              max={maxDate}
              style={{
                width: "100%", padding: "10px 12px", border: errors.dateOfBirth ? "1.5px solid #dc2626" : "1.5px solid #e5e7eb",
                borderRadius: "10px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                color: "#374151", outline: "none", background: "#fff",
              }}
              {...register("dateOfBirth", {
                required: "Ngày sinh là bắt buộc",
                validate: (v) => {
                  const d = new Date(v);
                  const minAge = new Date(); minAge.setFullYear(minAge.getFullYear() - 13);
                  return d <= minAge || "Bạn phải ít nhất 13 tuổi";
                },
              })}
            />
          </label>
          {errors.dateOfBirth && <p style={{ fontSize: "12px", color: "#dc2626", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{errors.dateOfBirth.message}</p>}
        </div>

        {/* Giới tính */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif", marginBottom: "2px" }}>
            Giới tính
          </label>
          <select
            style={{
              width: "100%", padding: "10px 12px", border: errors.gender ? "1.5px solid #dc2626" : "1.5px solid #e5e7eb",
              borderRadius: "10px", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
              color: "#374151", outline: "none", background: "#fff", cursor: "pointer",
            }}
            {...register("gender", { required: "Vui lòng chọn giới tính" })}
          >
            <option value="">-- Chọn giới tính --</option>
            <option value="0">Nam</option>
            <option value="1">Nữ</option>
            <option value="2">Khác</option>
          </select>
          {errors.gender && <p style={{ fontSize: "12px", color: "#dc2626", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{errors.gender.message}</p>}
        </div>

        {/* Đồng ý điều khoản */}
        <div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>
            <input type="checkbox" {...register("agreeTerms", { required: "Bạn phải đồng ý với điều khoản sử dụng" })}
              style={{ width: "16px", height: "16px", marginTop: "2px", accentColor: "#6366f1", cursor: "pointer", flexShrink: 0 }} />
            <span>
              Tôi đồng ý với{" "}
              <a href="#" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>Điều khoản dịch vụ</a>
              {" "}và{" "}
              <a href="#" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>Chính sách bảo mật</a>
            </span>
          </label>
          {errors.agreeTerms && <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontFamily: "'DM Sans', sans-serif" }}>{errors.agreeTerms.message}</p>}
        </div>

        <Button type="submit" loading={isLoading} fullWidth style={{ marginTop: "4px" }}>
          Tạo tài khoản
        </Button>

        {/* Hint về yêu cầu mật khẩu */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "#64748b", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
          <strong style={{ color: "#374151", display: "block", marginBottom: "4px" }}>Yêu cầu mật khẩu:</strong>
          Ít nhất 8 ký tự • 1 chữ hoa (A-Z) • 1 chữ số (0-9) • 1 ký tự đặc biệt (!@#$%^&*)
        </div>
      </div>
    </form>
  );
}