// components/common/GradientButton.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-width gradient CTA button with loading state.
// Used in: LoginForm, RegisterForm, any primary action
// ─────────────────────────────────────────────────────────────────────────────
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const Spinner = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round"
    style={{ animation: "gb-spin 0.75s linear infinite" }}
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

const GradientButton = ({
  children,
  loading = false,
  fullWidth = true,
  disabled,
  style,
  className = "",
  ...rest
}: GradientButtonProps) => (
  <>
    <style>{`@keyframes gb-spin { to { transform: rotate(360deg); } }`}</style>
    <button
      disabled={disabled || loading}
      className={className}
      style={{
        width: fullWidth ? "100%" : undefined,
        padding: "14px 24px",
        borderRadius: "12px",
        border: "none",
        cursor: loading || disabled ? "not-allowed" : "pointer",
        background:
          loading || disabled
            ? "#c4b5fd"
            : "linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "16px",
        fontWeight: 700,
        letterSpacing: "0.2px",
        boxShadow:
          loading || disabled
            ? "none"
            : "0 4px 18px rgba(99,102,241,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "opacity 0.15s, transform 0.12s, box-shadow 0.15s",
        opacity: loading || disabled ? 0.75 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!loading && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
      onMouseDown={(e) => {
        if (!loading && !disabled)
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
      }}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  </>
);

export default GradientButton;
