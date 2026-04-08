// components/common/TextInput.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Labeled input field with a left icon slot and optional right action.
// Supports: text, email, password (with show/hide toggle)
// Used in: LoginForm, RegisterForm, ProfileEditForm, etc.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;                     // field label above the input
  leftIcon?: ReactNode;               // icon inside left edge
  error?: string;                     // validation error message
  hint?: string;                      // helper text below
  showPasswordToggle?: boolean;       // renders eye icon for password fields
}

// Eye icons
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, leftIcon, error, hint, showPasswordToggle, type = "text", className = "", style, ...rest }, ref) => {
    const [showPass, setShowPass] = useState(false);
    const inputType = showPasswordToggle ? (showPass ? "text" : "password") : type;
    const hasError = Boolean(error);

    return (
      <div className={`flex flex-col gap-1.5 ${className}`} style={style}>
        {/* Label */}
        {label && (
          <label
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: hasError ? "#dc2626" : "#111827",
            }}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div
          className="flex items-center gap-2.5"
          style={{
            background: "#f3f4f6",
            borderRadius: "12px",
            border: hasError
              ? "1.5px solid #dc2626"
              : "1.5px solid transparent",
            padding: "0 14px",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          // Focus-within highlight via JS since Tailwind peer isn't guaranteed
          onFocus={() => {}}
        >
          {/* Left icon */}
          {leftIcon && (
            <span style={{ color: "#9ca3af", flexShrink: 0, display: "flex" }}>
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            {...rest}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              color: "#111827",
              padding: "13px 0",
            }}
            onFocus={(e) => {
              const wrapper = e.currentTarget.parentElement as HTMLElement;
              wrapper.style.borderColor = "#6366f1";
              wrapper.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              const wrapper = e.currentTarget.parentElement as HTMLElement;
              wrapper.style.borderColor = hasError ? "#dc2626" : "transparent";
              wrapper.style.boxShadow = "none";
              rest.onBlur?.(e);
            }}
          />

          {/* Right: password toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: "0",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <EyeIcon open={showPass} />
            </button>
          )}
        </div>

        {/* Error / hint */}
        {(error || hint) && (
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: error ? "#dc2626" : "#6b7280",
            }}
          >
            {error ?? hint}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";
export default TextInput;
