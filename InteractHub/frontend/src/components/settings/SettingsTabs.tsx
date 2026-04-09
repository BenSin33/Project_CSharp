import { User, Lock, Bell, Shield } from "lucide-react";

export type SettingsTab = "profile" | "account" | "notifications" | "privacy";

const TABS: { key: SettingsTab; label: string; Icon: React.ElementType }[] = [
  { key: "profile",       label: "Profile",       Icon: User   },
  { key: "account",       label: "Account",       Icon: Lock   },
  { key: "notifications", label: "Notifications", Icon: Bell   },
  { key: "privacy",       label: "Privacy",       Icon: Shield },
];

interface Props {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}
export default function SettingsTabs({ active, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-6">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[13px] transition-colors ${
            active === key
              ? "bg-white text-gray-900 font-medium border border-gray-100"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Icon size={13} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}