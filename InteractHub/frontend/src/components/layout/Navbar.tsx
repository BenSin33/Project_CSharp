import { useState, useCallback, useRef } from "react";
import UserMenu from "./userMenu";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavbarUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface NavbarProps {
  notificationCount?: number;
  user?: NavbarUser;
  onSearch?: (query: string) => void;
  onCreatePost?: () => void;
  onNotificationsClick?: () => void;
  onLogout?: () => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// ─── Logo ─────────────────────────────────────────────────────────────────────

const Logo = () => (
  <div className="flex items-center gap-3 select-none">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
        boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
      }}
    >
      <span style={{
        color: "#fff", fontWeight: 700, fontSize: "17px",
        fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.5px",
      }}>
        I
      </span>
    </div>
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
      fontSize: "18px", color: "#111827", letterSpacing: "-0.3px",
    }}>
      InteractHub
    </span>
  </div>
);

// ─── SearchBar ────────────────────────────────────────────────────────────────
// From V1: full self-contained logic (debounce, clear button, focus expand)
// From V2: clean prop interface

interface SearchBarProps {
  onSearch?: (query: string) => void;
  /** "expand" = widens on focus (default), "static" = fixed width */
  variant?: "expand" | "static";
  className?: string;
}

export const SearchBar = ({ onSearch, variant = "expand", className = "" }: SearchBarProps) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch?.(q), 400);
  }, [onSearch]);

  const handleClear = () => {
    setValue("");
    onSearch?.("");
  };

  const width = variant === "expand"
    ? (focused ? "420px" : "340px")
    : "100%";

  return (
    <div
      className={`relative flex items-center transition-all duration-200 ${className}`}
      style={{ width }}
    >
      <span
        className="absolute left-3.5 pointer-events-none transition-colors duration-150"
        style={{ color: focused ? "#6366f1" : "#9ca3af" }}
      >
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search..."
        className="w-full outline-none transition-all duration-200"
        style={{
          background: focused ? "#fff" : "#f3f4f6",
          border: focused ? "1.5px solid #6366f1" : "1.5px solid transparent",
          borderRadius: "999px",
          padding: "9px 36px 9px 38px",
          fontSize: "14px",
          fontFamily: "'DM Sans', sans-serif",
          color: "#111827",
          boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
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
};

// ─── CreatePostButton ─────────────────────────────────────────────────────────

interface CreatePostButtonProps {
  onClick?: () => void;
}

export const CreatePostButton = ({ onClick }: CreatePostButtonProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 font-semibold transition-all duration-150 active:scale-95 hover:brightness-110"
    style={{
      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      color: "#fff", border: "none", borderRadius: "999px",
      padding: "9px 20px 9px 16px", fontSize: "14px",
      fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
      cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
    }}
    aria-label="Create a post"
  >
    <span
      className="flex items-center justify-center rounded-md"
      style={{ background: "rgba(255,255,255,0.25)", padding: "2px", borderRadius: "6px" }}
    >
      <PlusIcon />
    </span>
    Post
  </button>
);

// ─── NotificationBell ─────────────────────────────────────────────────────────

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

export const NotificationBell = ({ count = 0, onClick }: NotificationBellProps) => (
  <button
    onClick={onClick}
    className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 hover:bg-gray-100 active:scale-95"
    style={{ color: "#374151", border: "none", background: "transparent", cursor: "pointer" }}
    aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
  >
    <BellIcon />
    {count > 0 && (
      <span
        className="absolute flex items-center justify-center font-bold"
        style={{
          top: "2px", right: "2px",
          minWidth: "18px", height: "18px",
          padding: "0 4px", borderRadius: "999px",
          background: "#ef4444", color: "#fff",
          fontSize: "10px", fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700, border: "2px solid #fff", lineHeight: 1,
        }}
      >
        {count > 99 ? "99+" : count}
      </span>
    )}
  </button>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
// From V1: self-contained initials derivation
// From V2: `as` prop pattern for semantic flexibility, `size` prop

interface AvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: number;
  /** Render as "button" (interactive) or "div" (display-only) */
  as?: "button" | "div";
  className?: string;
  onClick?: () => void;
}

export const Avatar = ({
  name = "User",
  avatarUrl,
  size = 38,
  as: Tag = "button",
  className = "",
  onClick,
}: AvatarProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sharedStyle: React.CSSProperties = {
    width: size, height: size, borderRadius: "50%",
    border: "none", padding: 0,
    cursor: Tag === "button" ? "pointer" : "default",
    overflow: "hidden", display: "flex",
    alignItems: "center", justifyContent: "center",
    background: avatarUrl
      ? "transparent"
      : "linear-gradient(135deg, #818cf8, #6366f1)",
    flexShrink: 0,
  };

  return (
    <Tag
      onClick={Tag === "button" ? onClick : undefined}
      className={`transition-all duration-150 ${Tag === "button" ? "hover:ring-2 hover:ring-indigo-400 active:scale-95" : ""} ${className}`}
      style={sharedStyle}
      aria-label={Tag === "button" ? "Profile menu" : undefined}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{
          color: "#fff", fontSize: `${Math.round(size * 0.34)}px`,
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        }}>
          {initials}
        </span>
      )}
    </Tag>
  );
};

// ─── Navbar (Main) ────────────────────────────────────────────────────────────

const Navbar = ({
  notificationCount = 0,
  user,
  onSearch,
  onCreatePost,
  onNotificationsClick,
  onLogout = () => {},
}: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <header
        className="w-full sticky top-0 z-50"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}
      >
        <nav
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: "1280px", padding: "10px 24px", gap: "16px" }}
        >
          {/* Left: Logo */}
          <Logo />

          {/* Center: Search */}
          <div className="flex-1 flex justify-center" style={{ maxWidth: "520px" }}>
            <SearchBar onSearch={onSearch} variant="expand" className="w-full" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <CreatePostButton onClick={onCreatePost} />

            <NotificationBell count={notificationCount} onClick={onNotificationsClick} />

            {/* Avatar + UserMenu inside relative wrapper */}
            <div className="relative">
              <Avatar
                name={user?.name ?? "User"}
                avatarUrl={user?.avatarUrl}
                size={38}
                as="button"
                onClick={() => setMenuOpen((v) => !v)}
              />
              {user && (
                <UserMenu
                  isOpen={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  user={user}
                  onLogout={onLogout}
                />
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;

// ─── Preview ──────────────────────────────────────────────────────────────────

export const NavbarPreview = () => (
  <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
    <Navbar
      notificationCount={3}
      user={{ name: "Alex Kim", email: "demo@user.com" }}
      onSearch={(q) => console.log("search:", q)}
      onCreatePost={() => console.log("create post")}
      onNotificationsClick={() => console.log("notifications")}
      onLogout={() => console.log("logout")}
    />
    <div style={{ padding: "40px 24px", color: "#6b7280", fontFamily: "DM Sans, sans-serif" }}>
      Page content goes here...
    </div>
  </div>
);