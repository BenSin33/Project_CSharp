import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { friendService } from "../services/friendService";
import RequestCard from "../components/friends/RequestCards";
import FriendCard from "../components/friends/FriendCard";
import SuggestionCard from "../components/friends/SuggestionCard";

type Tab = "requests" | "all" | "suggestions";

// ─── Mock data fallback ────────────────────────────────────────────────────────
const MOCK_REQUESTS = [
  { friendshipId: "fr-1", name: "Sarah Johnson",  username: "sarahj",    timeAgo: "4 days ago",  avatarUrl: "https://i.pravatar.cc/150?img=47" },
  { friendshipId: "fr-2", name: "Michael Chen",   username: "mchen",     timeAgo: "5 days ago",  avatarUrl: "https://i.pravatar.cc/150?img=12" },
  { friendshipId: "fr-3", name: "Olivia Smith",   username: "olivias",   timeAgo: "1 week ago",  avatarUrl: "https://i.pravatar.cc/150?img=21" },
];

const MOCK_FRIENDS = [
  { id: "f-1", name: "David Williams", username: "dwilliams", avatarUrl: "https://i.pravatar.cc/150?img=53" },
  { id: "f-2", name: "Emma Davis",     username: "emmad",     avatarUrl: "https://i.pravatar.cc/150?img=9"  },
  { id: "f-3", name: "James Wilson",   username: "jameswil",  avatarUrl: "https://i.pravatar.cc/150?img=33" },
  { id: "f-4", name: "Alex Turner",    username: "alexturner",avatarUrl: "https://i.pravatar.cc/150?img=68" },
  { id: "f-5", name: "Lisa Park",      username: "lisapark",  avatarUrl: "https://i.pravatar.cc/150?img=5"  },
];

const MOCK_SUGGESTIONS = [
  { id: "s-1", name: "Chris Evans",    label: "2 mutual friends",  avatarUrl: "https://i.pravatar.cc/150?img=11" },
  { id: "s-2", name: "Sophie Turner",  label: "5 mutual friends",  avatarUrl: "https://i.pravatar.cc/150?img=20" },
  { id: "s-3", name: "Ryan Mitchell",  label: "Suggested for you", avatarUrl: "https://i.pravatar.cc/150?img=59" },
  { id: "s-4", name: "Mia Johnson",    label: "3 mutual friends",  avatarUrl: "https://i.pravatar.cc/150?img=44" },
  { id: "s-5", name: "Tom Bradley",    label: "Suggested for you", avatarUrl: "https://i.pravatar.cc/150?img=67" },
  { id: "s-6", name: "Nina Patel",     label: "1 mutual friend",   avatarUrl: "https://i.pravatar.cc/150?img=16" },
];
// ──────────────────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("requests");

  const [requests, setRequests]       = useState<any[]>([]);
  const [friends, setFriends]         = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [loadingReq, setLoadingReq]   = useState(false);
  const [loadingFri, setLoadingFri]   = useState(false);
  const [loadingSug, setLoadingSug]   = useState(false);

  // Load friend requests — fallback to mock
  useEffect(() => {
    setLoadingReq(true);
    const load = async () => {
      try {
        if (!user?.id) throw new Error("no user");
        const data = await friendService.getPendingRequests(user.id);
        setRequests(data.length > 0 ? data : MOCK_REQUESTS);
      } catch {
        setRequests(MOCK_REQUESTS);
      } finally {
        setLoadingReq(false);
      }
    };
    load();
  }, [user?.id]);

  // Load friend list — fallback to mock
  useEffect(() => {
    if (tab !== "all") return;
    setLoadingFri(true);
    const load = async () => {
      try {
        if (!user?.id) throw new Error("no user");
        const data = await friendService.getFriendList(user.id);
        setFriends(data.length > 0 ? data : MOCK_FRIENDS);
      } catch {
        setFriends(MOCK_FRIENDS);
      } finally {
        setLoadingFri(false);
      }
    };
    load();
  }, [tab, user?.id]);

  // Load suggestions — fallback to mock
  useEffect(() => {
    if (tab !== "suggestions") return;
    setLoadingSug(true);
    const load = async () => {
      try {
        const data = await friendService.getSuggestions();
        setSuggestions(data.length > 0 ? data : MOCK_SUGGESTIONS);
      } catch {
        setSuggestions(MOCK_SUGGESTIONS);
      } finally {
        setLoadingSug(false);
      }
    };
    load();
  }, [tab]);

  const handleAccept = async (friendshipId: string) => {
    setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
    try {
      if (user?.id) await friendService.acceptRequest(friendshipId, user.id);
    } catch (err) {
      console.warn("accept failed", err);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
    try {
      if (user?.id) await friendService.rejectRequest(friendshipId, user.id);
    } catch (err) {
      console.warn("decline failed", err);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    try {
      if (user?.id) await friendService.removeFriend(friendId, user.id);
    } catch (err) {
      console.warn("unfriend failed", err);
    }
  };

  const handleAdd = async (userId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== userId));
    try {
      if (user?.id) await friendService.sendFriendRequest(user.id, userId);
    } catch (err) {
      console.warn("add friend failed", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[22px] font-semibold text-gray-900 mb-5">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit mb-5">
        {([
          ["requests",    "Requests",    requests.length],
          ["all",         "All Friends", 0],
          ["suggestions", "Suggestions", 0],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] transition-colors ${
              tab === key
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
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

      {/* Requests tab */}
      {tab === "requests" && (
        <div className="flex flex-col gap-2.5">
          {loadingReq ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No pending friend requests.</p>
          ) : (
            requests.map((r) => (
              <RequestCard
                key={r.friendshipId ?? r.id}
                id={r.friendshipId ?? r.id}
                name={r.name}
                username={r.username || r.name?.toLowerCase().replace(/\s/g, "")}
                timeAgo={r.timeAgo}
                avatarUrl={r.avatarUrl}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))
          )}
        </div>
      )}

      {/* All Friends tab */}
      {tab === "all" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {loadingFri ? (
            <p className="col-span-3 text-sm text-gray-400 py-4 text-center">Loading...</p>
          ) : friends.length === 0 ? (
            <p className="col-span-3 text-sm text-gray-400 py-4 text-center">No friends yet.</p>
          ) : (
            friends.map((f) => (
              <FriendCard
                key={f.id}
                name={f.name ?? f.fullName ?? ""}
                username={f.username || (f.name ?? "").toLowerCase().replace(/\s/g, "")}
                avatarUrl={f.avatarUrl}
                onUnfriend={() => handleUnfriend(f.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Suggestions tab */}
      {tab === "suggestions" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {loadingSug ? (
            <p className="col-span-3 text-sm text-gray-400 py-4 text-center">Loading...</p>
          ) : suggestions.length === 0 ? (
            <p className="col-span-3 text-sm text-gray-400 py-4 text-center">No suggestions available.</p>
          ) : (
            suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                id={s.id}
                name={s.name}
                label={s.label}
                avatarUrl={s.avatarUrl}
                onAdd={handleAdd}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}