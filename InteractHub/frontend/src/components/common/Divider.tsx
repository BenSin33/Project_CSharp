interface DividerProps {
  label?: string;
  className?: string;
}

export default function Divider({ label, className = "" }: DividerProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} role="separator" aria-label={label}>
      <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb", margin: 0 }} />
      {label && (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#9ca3af", whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
      <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb", margin: 0 }} />
    </div>
  );
}
