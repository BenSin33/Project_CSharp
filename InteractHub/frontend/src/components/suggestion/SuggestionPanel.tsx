import { useState } from "react";

interface SuggestedUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Props {
  users?: SuggestedUser[];
}

const DEFAULT_USERS: SuggestedUser[] = [
  { id: "1", name: "Alex Turner" },
  { id: "2", name: "Emma Davis" },
  { id: "3", name: "James Wilson" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SuggestionPanel({ users = DEFAULT_USERS }: Props) {
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
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[13px] font-medium text-gray-500 flex-shrink-0">
                {getInitials(user.name)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400">Suggested for you</p>
            </div>

            <button
              onClick={() => toggle(user.id)}
              className={`text-[13px] font-medium px-2 py-1 rounded-md transition-colors flex-shrink-0 ${
                followed.has(user.id)
                  ? "text-gray-400 bg-gray-100"
                  : "text-blue-600 hover:bg-blue-50"
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