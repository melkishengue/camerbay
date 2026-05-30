import { apiClient } from "@/lib/axios-api-client";
import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (!userId) return;

    const fetchUnread = async () => {
      try {
        const response = await apiClient.get<{ count: number }>("/api/v1/chat/unread");
        setUnreadCount(response.data.count);
      } catch {
        // silently fail
      }
    };

    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId]);

  return { unreadCount, isChatLoggedIn };
};
