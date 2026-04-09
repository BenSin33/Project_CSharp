interface Props {
  avatarUrl?: string;
  name: string;
  onUpload: (file: File) => void;
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
export default function AvatarUpload({ avatarUrl, name, onUpload }: Props) {
  return (
    <div className="flex items-center gap-4 pb-5 mb-5 border-b border-gray-100">
      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white text-[22px] font-medium flex-shrink-0 overflow-hidden">
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : initials(name)
        }
      </div>
      <div>
        <label className="inline-block h-[34px] px-4 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors leading-[34px]">
          Change Photo
          <input
            type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
        </label>
        <p className="text-[12px] text-gray-400 mt-1.5">JPG, PNG or GIF. Max 5MB</p>
      </div>
    </div>
  );
}