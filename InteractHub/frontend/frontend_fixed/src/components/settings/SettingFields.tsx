import type { ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}
export default function SettingsField({ label, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[13px] font-medium text-gray-900">{label}</label>
      {children}
    </div>
  );
}

// Shared input class — dùng lại ở mọi input/select/textarea:
export const inputCls =
  "w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-300 transition-colors font-sans";