import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const handle = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handle()}
        placeholder="Type a message..."
        className="flex-1 h-[42px] border border-gray-200 rounded-full px-4 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-300"
      />
      <button
        onClick={handle}
        className="w-[42px] h-[42px] rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <Send size={16} color="white" />
      </button>
    </div>
  );
}