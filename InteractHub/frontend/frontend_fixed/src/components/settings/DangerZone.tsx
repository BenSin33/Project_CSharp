interface Props {
  onDelete: () => void;
}
export default function DangerZone({ onDelete }: Props) {
  return (
    <div>
      <h3 className="text-[16px] font-medium text-red-600 mb-3">Danger Zone</h3>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-[15px] font-medium text-red-800 mb-1.5">Delete Account</p>
        <p className="text-[13px] text-red-700 mb-3 leading-relaxed">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={onDelete}
          className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium rounded-lg transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}