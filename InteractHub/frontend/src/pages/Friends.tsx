import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { friendService } from "../services/friendService";
import RequestCard from "../components/friends/RequestCards";
import FriendCard from "../components/friends/FriendCard";
import SuggestionCard from "../components/friends/SuggestionCard";

type Tab = "requests" | "all" | "suggestions";

export default function FriendsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("requests");

  const [requests, setRequests]     = useState<any[]>([]);
  const [friends, setFriends]       = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [loadingReq, setLoadingReq]   = useState(false);
  const [loadingFri, setLoadingFri]   = useState(false);
  const [loadingSug, setLoadingSug]   = useState(false);

  // Load friend requests
  useEffect(() => {
    if (!user?.id) return;
    setLoadingReq(true);
    friendService.getPendingRequests(user.id)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoadingReq(false));
  }, [user?.id]);

  // Load friend list khi chuyển sang tab all
  useEffect(() => {
    if (tab !== "all" || !user?.id) return;
    setLoadingFri(true);
    friendService.getFriendList(user.id)
      .then(setFriends)
      .catch(() => setFriends([]))
      .finally(() => setLoadingFri(false));
  }, [tab, user?.id]);

  // Load suggestions khi chuyển sang tab suggestions
  useEffect(() => {
    if (tab !== "suggestions") return;
    setLoadingSug(true);
    friendService.getSuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSug(false));
  }, [tab]);

  const handleAccept = async (friendshipId: string) => {
    if (!user?.id) return;
    try {
      await friendService.acceptRequest(friendshipId, user.id);
      setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
    } catch (err) {
      console.warn("accept failed", err);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    if (!user?.id) return;
    try {
      await friendService.rejectRequest(friendshipId, user.id);
      setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
    } catch (err) {
      console.warn("decline failed", err);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!user?.id) return;
    try {
      // friendId ở đây là userId của bạn bè, cần friendshipId để xóa
      // Tạm dùng userId làm friendshipId (cần backend hỗ trợ xóa theo userId)
      await friendService.removeFriend(friendId, user.id);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (err) {
      console.warn("unfriend failed", err);
    }
  };

  const handleAdd = async (userId: string) => {
    if (!user?.id) return;
    try {
      await friendService.sendFriendRequest(user.id, userId);
      setSuggestions((prev) => prev.filter((s) => s.id !== userId));
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
          ["requests", "Requests", requests.length],
          ["all",      "All Friends", 0],
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