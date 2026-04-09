import { useState } from "react";
import { Search } from "lucide-react";
import ConversationItem, { type Conversation } from "../components/messages/ConversationItem";
import ChatBubble, { type Message } from "../components/messages/ChatBubble";
import ChatHeader from "../components/messages/ChatHeader";
import ChatInput from "../components/messages/ChatInput";

const CONVS: Conversation[] = [
  { id:"1", name:"Sarah Johnson", preview:"Hey! How are you?",    time:"2m ago", unreadCount:2, avatarColor:"#e0e7ff", avatarTextColor:"#4338ca" },
  { id:"2", name:"Mike Chen",     preview:"Thanks for the help!", time:"1h ago",                avatarColor:"#fce7f3", avatarTextColor:"#9d174d" },
  { id:"3", name:"Emma Davis",    preview:"See you tomorrow!",    time:"3h ago",                avatarColor:"#d1fae5", avatarTextColor:"#065f46" },
  { id:"4", name:"Alex Turner",   preview:"That sounds great!",   time:"5h ago", unreadCount:1, avatarColor:"#fef3c7", avatarTextColor:"#92400e" },
  { id:"5", name:"James Wilson",  preview:"Let's catch up soon",  time:"1d ago",                avatarColor:"#ede9fe", avatarTextColor:"#6d28d9" },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id:"m1", text:"Hey! How are you?",                  time:"10:30 AM", isMine:false },
    { id:"m2", text:"I'm doing great! Thanks for asking", time:"10:32 AM", isMine:true  },
    { id:"m3", text:"That's wonderful to hear!",          time:"10:33 AM", isMine:false },
  ],
};

export default function MessagesPage() {
  const [activeId, setActiveId]   = useState("1");
  const [search, setSearch]       = useState("");
  const [messages, setMessages]   = useState(INITIAL_MESSAGES);

  const activeConv = CONVS.find(c => c.id === activeId)!;
  const currentMsgs = messages[activeId] ?? [];

  const handleSend = (text: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMine: true,
    };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), msg] }));
  };

  const filtered = CONVS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white border border-gray-100 rounded-xl overflow-hidden">

      {/* Sidebar */}
      <aside className="w-[300px] flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <h1 className="text-[20px] font-semibold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full h-9 bg-gray-100 border border-gray-100 rounded-full pl-8 pr-3 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeId}
              onClick={() => setActiveId(c.id)}
            />
          ))}
        </div>
      </aside>

      {/* Chat pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          name={activeConv.name}
          avatarColor={activeConv.avatarColor}
          avatarTextColor={activeConv.avatarTextColor}
        />
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {currentMsgs.map(m => <ChatBubble key={m.id} message={m} />)}
        </div>
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}