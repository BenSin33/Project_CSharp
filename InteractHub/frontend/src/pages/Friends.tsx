import { useState } from "react";
import RequestCard from "../components/friends/RequestCards";
import FriendCard from "../components/friends/FriendCard";
import SuggestionCard from "../components/friends/SuggestionCard";

type Tab = "requests" | "all" | "suggestions";

const REQUESTS = [
  { id: "1", name: "Sarah Johnson", username: "sarahj", timeAgo: "4 days ago" },
  { id: "2", name: "Michael Chen",  username: "mchen",  timeAgo: "5 days ago" },
];
const FRIENDS = [
  { id: "1", name: "David Williams", username: "dwilliams" },
];
const SUGGESTIONS = [
  { id: "1", name: "Alex Turner",  label: "Suggested for you" },
  { id: "2", name: "Emma Davis",   label: "Suggested for you" },
  { id: "3", name: "James Wilson", label: "Suggested for you" },
];

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("requests");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-[22px] font-semibold text-gray-900 mb-5">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit mb-5">
        {([["requests","Requests",2],["all","All Friends",0],["suggestions","Suggestions",0]] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-colors ${
              tab === key ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            {count > 0 && (
              <span className="bg-blue-600 text-white text-[11px] font-medium rounded-full px-1.5 py-px leading-none">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="flex flex-col gap-2.5">
          {REQUESTS.map(r => (
            <RequestCard key={r.id} {...r} onAccept={id => console.log("accept", id)} onDecline={id => console.log("decline", id)} />
          ))}
        </div>
      )}

      {tab === "all" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {FRIENDS.map(f => (
            <FriendCard key={f.id} {...f} onUnfriend={() => console.log("unfriend", f.id)} />
          ))}
        </div>
      )}

      {tab === "suggestions" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {SUGGESTIONS.map(s => (
            <SuggestionCard key={s.id} {...s} onAdd={id => console.log("add", id)} />
          ))}
        </div>
      )}
    </div>
  );
}