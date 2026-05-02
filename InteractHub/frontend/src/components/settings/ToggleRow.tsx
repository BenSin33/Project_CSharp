interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}
export default function ToggleRow({ label, description, checked, onChange }: Props) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 pr-4">
        <p className="text-[14px] font-medium text-gray-900">{label}</p>
        {description && <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-gray-900" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}