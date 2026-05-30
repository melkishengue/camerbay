import { apiClient } from "@/lib/axios-api-client";
import { chatEvents } from "@/lib/chatEvents";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "./useChat";

interface UnreadMessagesResult {
  unreadCount: number;
  isChatLoggedIn: boolean;
}

export const useUnreadChatMessages = (): UnreadMessagesResult => {
  const { userId } = useChat();
  const isChatLoggedIn = !!userId;
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const response = await apiClient.get<{ count: number }>("/api/v1/chat/unread");
      setUnreadCount(response.data.count);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchUnread]);

  useEffect(() => {
    if (!userId) return;
    return chatEvents.subscribe(() => fetchUnread());
  }, [userId, fetchUnread]);

  return { unreadCount, isChatLoggedIn };
};
