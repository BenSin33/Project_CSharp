interface ViewToggle {
  view: "grid" | "list";
  onChange: (v: "grid" | "list") => void;
}

interface Props {
  title: string;
  subtitle?: string;
  viewToggle?: ViewToggle;
}

export default function PageHeader({ title, subtitle, viewToggle }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-6 py-5 flex items-center justify-between">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-[14px] text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {viewToggle && (
        <div className="flex gap-2">
          <button
            onClick={() => viewToggle.onChange("grid")}
            title="Grid view"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              viewToggle.view === "grid"
                ? "bg-gray-900 text-white"
                : "border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <GridIcon />
          </button>
          <button
            onClick={() => viewToggle.onChange("list")}
            title="List view"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              viewToggle.view === "list"
                ? "bg-gray-900 text-white"
                : "border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ListIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}