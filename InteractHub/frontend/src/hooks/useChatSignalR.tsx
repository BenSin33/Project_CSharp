import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { MessageResponseDTO } from "../services/messageService";

const HUB_URL = "/hubs/chat";

export function useChatSignalR(
  token: string | null,
  onReceiveMessage: (msg: MessageResponseDTO) => void,
  onMessageSent: (msg: MessageResponseDTO) => void,
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const onReceiveRef = useRef(onReceiveMessage);
  const onSentRef = useRef(onMessageSent);

  // Keep callbacks current without reconnecting
  useEffect(() => { onReceiveRef.current = onReceiveMessage; }, [onReceiveMessage]);
  useEffect(() => { onSentRef.current = onMessageSent; }, [onMessageSent]);

  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets |
                   signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveMessage", (msg: MessageResponseDTO) => {
      onReceiveRef.current(msg);
    });

    connection.on("MessageSent", (msg: MessageResponseDTO) => {
      onSentRef.current(msg);
    });

    connection
      .start()
      .then(() => console.log("[SignalR] Connected"))
      .catch((err:any) => console.warn("[SignalR] Connection failed:", err));

    connectionRef.current = connection;

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [token]);

  const sendViaHub = useCallback(
    async (receiverId: string, content: string) => {
      const conn = connectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
        throw new Error("SignalR not connected");
      }
      await conn.invoke("SendMessage", receiverId, content);
    },
    [],
  );

  const isConnected = () =>
    connectionRef.current?.state === signalR.HubConnectionState.Connected;

  return { sendViaHub, isConnected };
}