// components/common/DemoAccountButton.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Outlined button used for demo account quick-access.
// Variant "user" = gray border | variant "admin" = orange/amber border
// Used in: LoginForm demo section
// ─────────────────────────────────────────────────────────────────────────────
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type DemoVariant = "user" | "admin";

export interface DemoAccountButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DemoVariant;
  icon?: ReactNode;
  label: string;
}

// Default icons
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const variantStyles: Record<DemoVariant, React.CSSProperties> = {
  user: {
    border: "1.5px solid #d1d5db",
    color: "#374151",
  },
  admin: {
    border: "1.5px solid #f97316",
    color: "#ea580c",
  },
};

const DemoAccountButton = ({
  variant = "user",
  icon,
  label,
  style,
  className = "",
  ...rest
}: DemoAccountButtonProps) => {
  const defaultIcon = variant === "admin" ? <ShieldIcon /> : <UserIcon />;

  return (
    <button
      className={className}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "13px 0",
        borderRadius: "12px",
        background: "#fff",
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "15px",
        fontWeight: 600,
        transition: "background 0.15s, transform 0.12s",
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          variant === "admin" ? "#fff7ed" : "#f9fafb";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#fff";
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
      {...rest}
    >
      <span style={{ display: "flex", alignItems: "center" }}>
        {icon ?? defaultIcon}
      </span>
      {label}
    </button>
  );
};

export default DemoAccountButton;
