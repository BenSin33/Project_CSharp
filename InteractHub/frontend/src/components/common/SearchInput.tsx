import { useState, useCallback, useRef } from "react";

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  debounceMs?: number;
  /** "expand" animates width on focus; "static" stays fixed */
  variant?: "expand" | "static";
  className?: string;
}

export default function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceMs = 400,
  variant = "static",
  className = "",
}: SearchInputProps) {
  const [value,   setValue]   = useState("");
  const [focused, setFocused] = useState(false);
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch?.(q), debounceMs);
  }, [onSearch, debounceMs]);

  const handleClear = () => { setValue(""); onSearch?.(""); };

  return (
    <div
      className={`relative flex items-center transition-all duration-200 ${className}`}
      style={variant === "expand" ? { width: focused ? "420px" : "340px" } : undefined}
    >
      <span className="absolute left-3.5 pointer-events-none transition-colors duration-150"
        style={{ color: focused ? "#6366f1" : "#9ca3af", display: "flex" }}>
        <SearchIcon />
      </span>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full outline-none transition-all duration-200"
        style={{
          background:   focused ? "#fff" : "#f3f4f6",
          border:       focused ? "1.5px solid #6366f1" : "1.5px solid transparent",
          borderRadius: "999px",
          padding:      "9px 36px 9px 38px",
          fontSize:     "14px",
          fontFamily:   "'DM Sans', sans-serif",
          color:        "#111827",
          boxShadow:    focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
        }}
      />

      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full hover:scale-110 transition-all duration-150"
          style={{ background: "#d1d5db", color: "#6b7280" }}
          aria-label="Clear search"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}