import { useState, useEffect } from "react";
import Avatar from "../common/Avatar";
import { friendService, type SuggestionDto } from "../../services/friendService";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function SuggestionPanel() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!user?.id) return;
      try {
        const data = await friendService.getSuggestions(user.id);
        setSuggestions(data.slice(0, 5)); // Lấy tối đa 5 người gợi ý
      } catch (err) {
        console.error("Failed to load suggestions", err);
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [user?.id]);

  const handleFollow = async (targetUserId: string) => {
    if (!user?.id) return;
    try {
      await friendService.sendFriendRequest(user.id, targetUserId);
      setFollowed((prev) => new Set(prev).add(targetUserId));
    } catch (err) {
      console.error("Failed to send friend request", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex justify-center">
        <Loader2 size={20} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-3">Suggestions for you</h3>
      <ul className="flex flex-col gap-1">
        {suggestions.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-2">
            <Avatar name={s.name} avatarUrl={s.avatarUrl} size={38} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">{s.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Suggested for you</p>
            </div>
            <button
              onClick={() => handleFollow(s.id)}
              disabled={followed.has(s.id)}
              className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                followed.has(s.id) 
                  ? "text-gray-400 bg-gray-50 cursor-default" 
                  : "text-blue-600 hover:bg-blue-50 active:scale-95"
              }`}
            >
              {followed.has(s.id) ? "Requested" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}