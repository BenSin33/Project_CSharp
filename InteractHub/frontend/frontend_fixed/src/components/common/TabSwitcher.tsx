// components/common/TabSwitcher.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Pill-style tab switcher. Generic — works for any 2-tab toggle.
// Used in: LoginPage (Login | Sign Up)
// ─────────────────────────────────────────────────────────────────────────────

export interface TabOption {
  label: string;
  value: string;
}

interface TabSwitcherProps {
  options: TabOption[];               // exactly 2 items recommended
  value: string;                      // currently active tab value
  onChange: (value: string) => void;
  className?: string;
}

const TabSwitcher = ({ options, value, onChange, className = "" }: TabSwitcherProps) => (
  <div
    className={`flex p-1 rounded-full ${className}`}
    style={{
      background: "#efefef",
      gap: "4px",
    }}
    role="tablist"
    aria-label="Auth mode switcher"
  >
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "15px",
            fontWeight: active ? 600 : 400,
            color: active ? "#111827" : "#6b7280",
            background: active ? "#ffffff" : "transparent",
            boxShadow: active ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
            transition: "all 0.18s ease",
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default TabSwitcher;
