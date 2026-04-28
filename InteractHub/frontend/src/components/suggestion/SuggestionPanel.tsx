import { useState } from "react";
import Avatar from "../common/Avatar";
import { MOCK_SUGGESTED_SIDEBAR } from "../../constants/mock";
import type { SuggestedUser } from "../../types";

interface SuggestionPanelProps {
  users?: SuggestedUser[];
}

export default function SuggestionPanel({ users = MOCK_SUGGESTED_SIDEBAR }: SuggestionPanelProps) {
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-[15px] font-medium text-gray-900 mb-3">Suggestions</h3>
      <ul className="flex flex-col divide-y divide-gray-100">
        {users.map((user) => (
          <li key={user.id} className="flex items-center gap-3 py-2">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400">Suggested for you</p>
            </div>
            <button
              onClick={() => toggle(user.id)}
              className={`text-[13px] font-medium px-2 py-1 rounded-md transition-colors flex-shrink-0 ${
                followed.has(user.id) ? "text-gray-400 bg-gray-100" : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              {followed.has(user.id) ? "Following" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}