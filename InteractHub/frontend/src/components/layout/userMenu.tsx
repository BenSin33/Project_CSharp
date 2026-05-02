import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";
import Avatar from "../common/Avatar";
import type { User as UserType } from "../../types";

interface UserMenuProps {
  isOpen:    boolean;
  onClose:   () => void;
  user:      Pick<UserType, "name" | "email" | "avatarUrl">;
  onLogout?: () => void;
}

function MenuItem({ icon: Icon, label, onClick, danger = false }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] transition-colors ${danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Icon size={16} strokeWidth={1.8} />
      {label}
    </button>
  );
}

export default function UserMenu({ isOpen, onClose, user, onLogout }: UserMenuProps) {
  const ref      = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => { navigate(path); onClose(); };
  const handleLogout   = () => { onLogout?.(); onClose(); navigate("/login"); };

  return (
    <div ref={ref}
      className="absolute top-full right-0 mt-2 w-[210px] bg-white border border-gray-100 rounded-xl overflow-hidden z-50"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}>

      {/* User info */}
      <div className="px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size={36} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="py-1">
        <MenuItem icon={User}     label="Profile"  onClick={() => handleNavigate("/profile")}  />
        <MenuItem icon={Settings} label="Settings" onClick={() => handleNavigate("/settings")} />
      </div>

      <div className="border-t border-gray-100 py-1">
        <MenuItem icon={LogOut} label="Logout" onClick={handleLogout} danger />
      </div>
    </div>
  );
}