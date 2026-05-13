import Avatar from "../common/Avatar";

interface Props {
  avatarUrl?: string;
  name: string;
  onUpload: (file: File) => void;
}

export default function AvatarUpload({ avatarUrl, name, onUpload }: Props) {
  return (
    <div className="flex items-center gap-4 pb-5 mb-5 border-b border-gray-100">
      <Avatar name={name} avatarUrl={avatarUrl} size={64} />
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