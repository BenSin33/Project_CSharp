import type { ReactNode } from "react";

export interface TabItem<T extends string = string> {
  value:    T;
  label:    string;
  icon?:    ReactNode;
  badge?:   number;
}

export type TabsVariant = "pill" | "underline" | "segment";

interface TabsProps<T extends string = string> {
  tabs:     TabItem<T>[];
  active:   T;
  onChange: (value: T) => void;
  variant?: TabsVariant;
  className?: string;
}

export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant   = "segment",
  className = "",
}: TabsProps<T>) {

  if (variant === "underline") {
    return (
      <div className={`flex border-b border-gray-100 ${className}`}>
        {tabs.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] transition-colors border-b-2 -mb-px ${
              active === value
                ? "text-gray-900 font-medium border-gray-900"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div
        className={`flex p-1 rounded-full ${className}`}
        style={{ background: "#efefef", gap: "4px" }}
        role="tablist"
      >
        {tabs.map(({ value, label }) => {
          const isActive = value === active;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(value)}
              style={{
                flex:        1,
                padding:     "10px 0",
                borderRadius:"999px",
                border:      "none",
                cursor:      "pointer",
                fontFamily:  "'DM Sans', sans-serif",
                fontSize:    "15px",
                fontWeight:  isActive ? 600 : 400,
                color:       isActive ? "#111827" : "#6b7280",
                background:  isActive ? "#ffffff" : "transparent",
                boxShadow:   isActive ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
                transition:  "all 0.18s ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // variant === "segment" (default)
  return (
    <div className={`flex gap-1 bg-white border border-gray-100 rounded-xl p-1.5 ${className}`}>
      {tabs.map(({ value, label, icon, badge }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[13px] transition-colors ${
            active === value
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {icon}
          {label}
          {badge != null && badge > 0 && (
            <span className="bg-blue-600 text-white text-[11px] font-medium rounded-full px-1.5 py-px leading-none">
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}