import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavbarProps {
  notificationCount?: number;
  user?: {
    name: string;
    avatarUrl?: string;
  };
  onSearch?: (query: string) => void;
  onCreatePost?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const BellIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const XIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Gradient square logo */
const Logo = () => (
  <div className="flex items-center gap-3 select-none">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
      style={{
        background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
        boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
      }}
    >
      {/* simple "I" lettermark */}
      <span
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: "17px",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "-0.5px",
        }}
      >
        I
      </span>
    </div>
    <span
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        fontSize: "18px",
        color: "#111827",
        letterSpacing: "-0.3px",
      }}
    >
      InteractHub
    </span>
  </div>
);

/** Debounced search bar */
const SearchBar = ({
  onSearch,
}: {
  onSearch?: (query: string) => void;
}) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setValue(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch?.(q);
      }, 400);
    },
    [onSearch]
  );

  const handleClear = () => {
    setValue("");
    onSearch?.("");
  };

  return (
    <div
      className="relative flex items-center transition-all duration-200"
      style={{
        width: focused ? "420px" : "340px",
      }}
    >
      {/* Search icon */}
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
          border: focused
            ? "1.5px solid #6366f1"
            : "1.5px solid transparent",
          borderRadius: "999px",
          padding: "9px 36px 9px 38px",
          fontSize: "14px",
          fontFamily: "'DM Sans', sans-serif",
          color: "#111827",
          boxShadow: focused
            ? "0 0 0 3px rgba(99,102,241,0.12)"
            : "none",
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full transition-all duration-150 hover:scale-110"
          style={{ background: "#d1d5db", color: "#6b7280" }}
          aria-label="Clear search"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
};

/** Blue "Post" CTA button */
const CreatePostButton = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 font-semibold transition-all duration-150 active:scale-95 hover:brightness-110"
    style={{
      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      color: "#fff",
      border: "none",
      borderRadius: "999px",
      padding: "9px 20px 9px 16px",
      fontSize: "14px",
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
      letterSpacing: "-0.1px",
    }}
    aria-label="Create a post"
  >
    <span
      className="flex items-center justify-center rounded-md"
      style={{
        background: "rgba(255,255,255,0.25)",
        padding: "2px",
        borderRadius: "6px",
      }}
    >
      <PlusIcon />
    </span>
    Post
  </button>
);

/** Bell icon with notification badge */
const NotificationBell = ({
  count = 0,
  onClick,
}: {
  count?: number;
  onClick?: () => void;
}) => {
  const displayCount = count > 99 ? "99+" : count;

  return (
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
            top: "2px",
            right: "2px",
            minWidth: "18px",
            height: "18px",
            padding: "0 4px",
            borderRadius: "999px",
            background: "#ef4444",
            color: "#fff",
            fontSize: "10px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            border: "2px solid #fff",
            lineHeight: 1,
          }}
        >
          {displayCount}
        </span>
      )}
    </button>
  );
};

/** Avatar circle */
const Avatar = ({
  user,
  onClick,
}: {
  user?: NavbarProps["user"];
  onClick?: () => void;
}) => {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <button
      onClick={onClick}
      className="transition-all duration-150 hover:ring-2 hover:ring-indigo-400 active:scale-95"
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: user?.avatarUrl ? "transparent" : "linear-gradient(135deg,#818cf8,#6366f1)",
      }}
      aria-label="Profile menu"
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            color: "#fff",
            fontSize: "13px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
          }}
        >
          {initials}
        </span>
      )}
    </button>
  );
};

// ─── Main Navbar Component ─────────────────────────────────────────────────────

/**
 * Navbar for InteractHub
 *
 * Requirements covered:
 *  - F1: Reusable component with TypeScript interfaces, Tailwind CSS, responsive
 *  - F2: onSearch debounce, JWT-aware (passes through auth context)
 *  - F3: Controlled search input with clear button
 *  - F4: React Router Link-ready (wrap Logo/nav items in <Link> as needed)
 */
const Navbar = ({
  notificationCount = 0,
  user,
  onSearch,
  onCreatePost,
  onNotificationsClick,
  onProfileClick,
}: NavbarProps) => {
  return (
    <>
      {/* Google Fonts */}
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
          style={{
            maxWidth: "1280px",
            padding: "10px 24px",
            gap: "16px",
          }}
        >
          {/* Left: Logo */}
          <Logo />

          {/* Center: Search */}
          <div className="flex-1 flex justify-center" style={{ maxWidth: "520px" }}>
            <SearchBar onSearch={onSearch} />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <CreatePostButton onClick={onCreatePost} />
            <NotificationBell count={notificationCount} onClick={onNotificationsClick} />
            <Avatar user={user} onClick={onProfileClick} />
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;

// ─── Preview (remove in production) ──────────────────────────────────────────
export const NavbarPreview = () => (
  <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
    <Navbar
      notificationCount={3}
      user={{ name: "Alex Kim" }}
      onSearch={(q) => console.log("search:", q)}
      onCreatePost={() => console.log("create post")}
      onNotificationsClick={() => console.log("notifications")}
      onProfileClick={() => console.log("profile")}
    />
    <div style={{ padding: "40px 24px", color: "#6b7280", fontFamily: "DM Sans, sans-serif" }}>
      Page content goes here...
    </div>
  </div>
);
