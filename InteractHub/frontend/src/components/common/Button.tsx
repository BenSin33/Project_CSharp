import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize    = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
}

const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" style={{ animation: "btn-spin 0.75s linear infinite" }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background:  "linear-gradient(90deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)",
    color:       "#fff",
    border:      "none",
    boxShadow:   "0 4px 18px rgba(99,102,241,0.4)",
  },
  secondary: {
    background:  "#111827",
    color:       "#fff",
    border:      "none",
    boxShadow:   "none",
  },
  ghost: {
    background:  "transparent",
    color:       "#374151",
    border:      "none",
    boxShadow:   "none",
  },
  danger: {
    background:  "#ef4444",
    color:       "#fff",
    border:      "none",
    boxShadow:   "0 4px 14px rgba(239,68,68,0.3)",
  },
  outline: {
    background:  "#fff",
    color:       "#374151",
    border:      "1.5px solid #d1d5db",
    boxShadow:   "none",
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 14px",  fontSize: "13px", borderRadius: "8px"  },
  md: { padding: "10px 20px", fontSize: "14px", borderRadius: "10px" },
  lg: { padding: "14px 24px", fontSize: "16px", borderRadius: "12px" },
};

export default function Button({
  children,
  variant   = "primary",
  size      = "md",
  loading   = false,
  fullWidth = false,
  leftIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <>
      <style>{`@keyframes btn-spin { to { transform: rotate(360deg); } }`}</style>
      <button
        disabled={isDisabled}
        style={{
          width:           fullWidth ? "100%" : undefined,
          display:         "inline-flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "8px",
          fontFamily:      "'DM Sans', sans-serif",
          fontWeight:      600,
          cursor:          isDisabled ? "not-allowed" : "pointer",
          opacity:         isDisabled ? 0.6 : 1,
          transition:      "opacity 0.15s, transform 0.12s, box-shadow 0.15s",
          ...VARIANT_STYLES[variant],
          ...SIZE_STYLES[size],
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        onMouseDown={(e) => {
          if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
        {...rest}
      >
        {loading ? <Spinner /> : leftIcon}
        {children}
      </button>
    </>
  );
}