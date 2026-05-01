interface EmptyStateProps {
  label: string;
  className?: string;
}

export default function EmptyState({ label, className = "" }: EmptyStateProps) {
  return (
    <div className={`py-12 text-center text-[14px] text-gray-400 ${className}`}>
      {label}
    </div>
  );
}