import { LikeType } from "../../services/likeService";

interface ReactionOption {
  type: LikeType;
  label: string;
  emoji: string;
  color: string;
}

export const REACTION_OPTIONS: ReactionOption[] = [
  { type: LikeType.LIKE,  label: "Like",  emoji: "👍", color: "text-blue-500" },
  { type: LikeType.LOVE,  label: "Love",  emoji: "❤️", color: "text-red-500" },
  { type: LikeType.HAHA,  label: "Haha",  emoji: "😆", color: "text-yellow-500" },
  { type: LikeType.WOW,   label: "Wow",   emoji: "😮", color: "text-yellow-500" },
  { type: LikeType.SAD,   label: "Sad",   emoji: "😢", color: "text-yellow-600" },
  { type: LikeType.ANGRY, label: "Angry", emoji: "😡", color: "text-orange-600" },
];

interface ReactionPickerProps {
  onSelect: (type: LikeType) => void;
  isVisible: boolean;
}

export default function ReactionPicker({ onSelect, isVisible }: ReactionPickerProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 p-1 bg-white rounded-full shadow-xl border border-gray-100 flex items-center gap-1 animate-in slide-in-from-bottom-2 duration-200 z-50 reaction-picker">
      {REACTION_OPTIONS.map((reaction) => (
        <button
          key={reaction.type}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(reaction.type);
          }}
          type="button"
          className="w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 transition-transform duration-200 hover:bg-gray-50 rounded-full group relative"
          title={reaction.label}
        >
          <span>{reaction.emoji}</span>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {reaction.label}
          </span>
        </button>
      ))}
    </div>
  );
}
