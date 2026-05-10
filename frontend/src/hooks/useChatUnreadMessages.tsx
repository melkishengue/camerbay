import { useEffect, useState } from "react";
import { useChat } from "./useChat";

interface UnreadMessagesResult {
  unreadCount: number;
  isChatLoggedIn: boolean;
}

export const useUnreadChatMessages = (): UnreadMessagesResult => {
  const { chatClient } = useChat();
  const isChatLoggedIn = !!chatClient?.userID;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!chatClient?.userID) return;

    // Function to fetch unread count
    const fetchUnreadCount = async () => {
      try {
        // Query channels to get unread counts
        const filters = {
          members: { $in: [chatClient.userID] },
          type: "messaging"
        };

        const channels = await chatClient.queryChannels(
          filters as any,
          {},
          {
            state: true,
            watch: false,
            presence: false
          }
        );

        // Sum up unread counts from all channels
        const total = channels.reduce((sum, channel) => {
          return sum + (channel.countUnread() || 0);
        }, 0);

        setUnreadCount(total);
      } catch (error) {

      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Listen for events that might change unread count
    const handleEvent = () => {
      fetchUnreadCount();
    };

    chatClient.on("message.new", handleEvent);
    chatClient.on("message.read", handleEvent);
    chatClient.on("notification.message_new", handleEvent);
    chatClient.on("notification.mark_read", handleEvent);

    return () => {
      chatClient.off("message.new", handleEvent);
      chatClient.off("message.read", handleEvent);
      chatClient.off("notification.message_new", handleEvent);
      chatClient.off("notification.mark_read", handleEvent);
    };
  }, [chatClient]);

  return {
    unreadCount,
    isChatLoggedIn
  };
};
