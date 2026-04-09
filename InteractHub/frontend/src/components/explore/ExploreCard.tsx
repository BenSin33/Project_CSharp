interface Props {
  label: string;
  imageUrl?: string;
  color?: string;
  badgeColor?: string;
  onClick?: () => void;
}
export default function ExploreCategoryCard({ label, imageUrl, color = "#374151", badgeColor = "#2563eb", onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-xl overflow-hidden aspect-square cursor-pointer group"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full" style={{ background: color }} />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors rounded-xl" />
      <span
        className="absolute top-2.5 left-2.5 text-white text-[12px] font-medium px-2.5 py-1 rounded-full"
        style={{ background: badgeColor }}
      >
        {label}
      </span>
    </div>
  );
}