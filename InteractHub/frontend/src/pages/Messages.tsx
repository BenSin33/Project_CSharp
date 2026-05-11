import { useState, useEffect, useRef, useCallback } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import ConversationItem, { type Conversation } from "../components/messages/ConversationItem";
import ChatBubble, { type Message } from "../components/messages/ChatBubble";
import ChatHeader from "../components/messages/ChatHeader";
import ChatInput from "../components/messages/ChatInput";
import {
  getConversations,
  getConversation,
  sendMessage,
  normalizeMessage,
  type ConversationDTO,
  type MessageResponseDTO,
} from "../services/messageService";
import { useAuth } from "../contexts/AuthContext";

function toConversation(dto: ConversationDTO): Conversation {
  // const initials = dto.userName
  //   .split(" ")
  //   .map(n => n[0])
  //   .join("")
  //   .slice(0, 2)
  //   .toUpperCase();
  return {
    id: String(dto.userId),
    name: dto.userName ?? "Unknown User",
    preview: dto.lastMessage ?? "",
    time: new Date(dto.lastMessageTime ?? new Date().toISOString()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    unreadCount: dto.unreadCount || undefined,
    avatarUrl: dto.userAvatar,
    avatarColor: "#e0e7ff",
    avatarTextColor: "#4338ca",
  };
}

function toMessage(dto: MessageResponseDTO, currentUserId: string): Message {
  return {
    id: String(dto.id),
    text: dto.messageContent ?? "",
    time: new Date(dto.sentAt ?? new Date().toISOString()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isMine: String(dto.senderId) === currentUserId,
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const locationState = location.state as { openUserId?: string; openUserName?: string } | null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(locationState?.openUserId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const allData = await getConversations();
      const data = allData.filter(c => String(c.userId) !== String(user.id));
      setConversations(data.map(toConversation));
      // If no activeId yet, default to first conversation (that is not self)
      if (!activeId && !locationState?.openUserId && data.length > 0) {
        const firstOther = data.find(c => String(c.userId) !== String(user.id));
        if (firstOther) {
          setActiveId(String(firstOther.userId));
        }
      }
      // If we navigated here with a target user, ensure they appear in conversation list
      if (locationState?.openUserId) {
        const exists = data.some(d => String(d.userId) === String(locationState.openUserId));
        if (!exists && locationState.openUserName) {
          const ghost: Conversation = {
            id: locationState.openUserId,
            name: locationState.openUserName,
            preview: "",
            time: "",
            avatarColor: "#e0e7ff",
            avatarTextColor: "#4338ca",
          };
          setConversations(prev => {
            const alreadyAdded = prev.some(c => c.id === ghost.id);
            return alreadyAdded ? prev : [ghost, ...prev];
          });
        }
        setActiveId(locationState.openUserId);
      }
    } catch (err) {
      console.error("loadConversations error:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, [activeId, locationState]);

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;
    setLoadingMsgs(true);
    try {
      const data = await getConversation(otherUserId);
      setMessages(data.map(m => toMessage(m, user.id)));
    } catch (err) {
      console.error("loadMessages error:", err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeIdRef = useRef<string | null>(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const [connection, setConnection] = useState<HubConnection | null>(null);

  // Initialize SignalR connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl("/hubs/chat", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);
    
    return () => {
      newConnection.stop();
    };
  }, []);

  // Register listeners once
  useEffect(() => {
    if (!connection || !user) return;

    const startConnection = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
          console.log("[SignalR] Connected to ChatHub");
        }

        connection.on("ReceiveMessage", (rawMessage: any) => {
          const normalized = normalizeMessage(rawMessage);
          const msg = toMessage(normalized, user.id);
          const currentActiveId = activeIdRef.current;
          
          // Check if message belongs to current conversation
          const isFromActive = String(normalized.senderId) === currentActiveId;
          const isToActive = String(normalized.receiverId) === currentActiveId;

          if (isFromActive || isToActive) {
            setMessages((prev) => {
              const exists = prev.some(m => m.id === msg.id);
              if (exists) return prev;
              return [...prev, msg];
            });
          }

          loadConversations();
        });

        connection.on("MessageSent", (rawMessage: any) => {
          const msg = toMessage(normalizeMessage(rawMessage), user.id);
          setMessages((prev) => {
             const exists = prev.some(m => m.id === msg.id || m.id.startsWith("opt-"));
             if (exists) {
                return prev.map(m => (m.id.startsWith("opt-") && m.text === msg.text) ? msg : m);
             }
             return [...prev, msg];
          });
          loadConversations();
        });

      } catch (err) {
        console.error("[SignalR] Connection failed: ", err);
      }
    };

    startConnection();

    return () => {
      connection.off("ReceiveMessage");
      connection.off("MessageSent");
    };
  }, [connection, user, loadConversations]);

  const handleSend = async (text: string) => {
    if (!activeId || !user || sending) return;
    if (activeId === String(user.id)) return;
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: "opt-" + Date.now(),
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMine: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const sent = await sendMessage({ messageContent: text, receiverId: activeId });
      // Replace optimistic with real message
      setMessages(prev => prev.map(m =>
        m.id === optimistic.id ? toMessage(sent, user.id) : m
      ));
      // Update conversation preview
      setConversations(prev => prev.map(c =>
        c.id === activeId ? { ...c, preview: text, time: optimistic.time } : c
      ));
      // Reload conversation list so order updates
      await loadConversations();
    } catch (err) {
      console.error("sendMessage error:", err);
      // Revert optimistic
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);
  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-88px)] bg-white border border-gray-100 rounded-xl overflow-hidden">

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
          {loadingConvs ? (
            <div className="p-4 flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-2 bg-gray-100 rounded w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {search ? "No conversations found" : "No messages yet"}
            </div>
          ) : (
            filtered.map(c => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeId}
                onClick={() => setActiveId(c.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Chat pane */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            name={activeConv.name}
            avatarUrl={activeConv.avatarUrl}
            avatarColor={activeConv.avatarColor}
            avatarTextColor={activeConv.avatarTextColor}
          />
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {loadingMsgs ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                    <div className="h-10 w-48 bg-gray-200 rounded-2xl animate-pulse" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                No messages yet. Say hello! 👋
              </div>
            ) : (
              messages.map(m => <ChatBubble key={m.id} message={m} />)
            )}
            <div ref={chatBottomRef} />
          </div>
          <ChatInput onSend={handleSend} disabled={sending} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">Select a conversation</p>
            <p className="text-xs text-gray-400 mt-1">Choose from your messages on the left</p>
          </div>
        </div>
      )}
    </div>
  );
}