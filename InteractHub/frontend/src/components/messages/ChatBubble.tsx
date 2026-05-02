interface Message {
  id: string;
  text: string;
  time: string;
  isMine: boolean;
}

interface Props {
  message: Message;
}

export default function ChatBubble({ message: m }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${m.isMine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[70%] px-3.5 py-2.5 text-[14px] leading-snug ${
          m.isMine
            ? "bg-blue-600 text-white rounded-2xl rounded-br-[4px]"
            : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-[4px]"
        }`}
      >
        {m.text}
      </div>
      <span className="text-[11px] text-gray-400 px-1">{m.time}</span>
    </div>
  );
}

export type { Message };