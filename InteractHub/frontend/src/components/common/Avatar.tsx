import { getInitials } from "../../utils/format";

export interface AvatarProps {
  name: string;
  avatarUrl?: string;
  /** px size, default 40 */
  size?: number;
  /** Tailwind ring on hover, e.g. "hover:ring-2 hover:ring-indigo-400" */
  className?: string;
  /** Gradient fallback: "indigo" (default) | "blue" | "gray" */
  variant?: "indigo" | "blue" | "gray";
  onClick?: () => void;
  as?: "div" | "button";
}

const GRADIENTS: Record<NonNullable<AvatarProps["variant"]>, string> = {
  indigo: "linear-gradient(135deg,#818cf8,#6366f1)",
  blue:   "linear-gradient(135deg,#60a5fa,#3b82f6)",
  gray:   "#d1d5db",
};

const TEXT_COLORS: Record<NonNullable<AvatarProps["variant"]>, string> = {
  indigo: "#fff",
  blue:   "#fff",
  gray:   "#6b7280",
};

export default function Avatar({
  name,
  avatarUrl,
  size = 40,
  className = "",
  variant = "indigo",
  onClick,
  as: Tag = "div",
}: AvatarProps) {
  const initials  = getInitials(name);
  const fontSize  = Math.round(size * 0.35);

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    background: avatarUrl ? "transparent" : GRADIENTS[variant],
    cursor: onClick ? "pointer" : undefined,
    border: "none",
    padding: 0,
  };

  const inner = avatarUrl ? (
    <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : (
    <span style={{ color: TEXT_COLORS[variant], fontSize, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
      {initials}
    </span>
  );

  return (
    <Tag style={baseStyle} className={className} onClick={onClick} aria-label={name}>
      {inner}
    </Tag>
  );
}