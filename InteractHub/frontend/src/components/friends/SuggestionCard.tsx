import { useState } from "react";
import FriendAvatar from "./FriendAvatar";

interface Props {
  id: string;
  name: string;
  label?: string;
  avatarUrl?: string;
  onAdd: (id: string) => void;
}
export default function SuggestionCard({ id, name, label = "Suggested for you", avatarUrl, onAdd }: Props) {
  const [added, setAdded] = useState(false);
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
      <FriendAvatar name={name} avatarUrl={avatarUrl} size={56} />
      <div>
        <p className="text-[14px] font-medium text-gray-900 leading-snug">{name}</p>
        <p className="text-[12px] text-gray-400 mt-0.5">{label}</p>
      </div>
      <button
        onClick={() => { if (!added) { setAdded(true); onAdd(id); } }}
        className={`w-full h-8 rounded-lg flex items-center justify-center gap-1.5 text-[12px] font-medium mt-1 transition-colors ${
          added
            ? "bg-gray-100 text-gray-400 cursor-default"
            : "bg-gray-900 text-white hover:bg-gray-700"
        }`}
      >
        {added ? <CheckIcon /> : <AddIcon />}
        {added ? "Added" : "Add"}
      </button>
    </div>
  );
}
function AddIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>;
}