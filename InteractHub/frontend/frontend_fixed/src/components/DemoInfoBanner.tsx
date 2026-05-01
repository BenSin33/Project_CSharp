// components/common/DemoInfoBanner.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A soft blue info box for displaying credential hints / messages.
// Generic — accepts any label+value pairs.
// Used in: LoginForm demo section
// ─────────────────────────────────────────────────────────────────────────────

export interface DemoCredential {
  label: string;   // e.g. "Admin Demo:"
  value: string;   // e.g. "admin@interacthub.com / admin123"
}

interface DemoInfoBannerProps {
  credentials: DemoCredential[];
  className?: string;
}

const DemoInfoBanner = ({ credentials, className = "" }: DemoInfoBannerProps) => (
  <div
    className={className}
    style={{
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      borderRadius: "12px",
      padding: "12px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}
  >
    {credentials.map((cred) => (
      <p
        key={cred.label}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          color: "#1e40af",
          margin: 0,
        }}
      >
        <strong style={{ fontWeight: 700 }}>{cred.label}</strong>{" "}
        <span style={{ fontWeight: 400, color: "#3b82f6" }}>{cred.value}</span>
      </p>
    ))}
  </div>
);

export default DemoInfoBanner;
