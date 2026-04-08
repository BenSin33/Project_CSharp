// components/common/Divider.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Horizontal rule with optional centered label.
// Used in: LoginForm ("Demo Accounts" separator), any section divider
// ─────────────────────────────────────────────────────────────────────────────

interface DividerProps {
  label?: string;
  className?: string;
}

const Divider = ({ label, className = "" }: DividerProps) => (
  <div
    className={`flex items-center gap-3 ${className}`}
    role="separator"
    aria-label={label}
  >
    <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb", margin: 0 }} />
    {label && (
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          color: "#9ca3af",
          whiteSpace: "nowrap",
          fontWeight: 400,
        }}
      >
        {label}
      </span>
    )}
    <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb", margin: 0 }} />
  </div>
);

export default Divider;
