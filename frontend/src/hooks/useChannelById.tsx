import { apiClient } from "@/lib/axios-api-client";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import type { Channel } from "stream-chat";
import { useChat } from "./useChat";

interface ChannelDisplayInfo {
  name: string;
  image?: string;
}

interface CreateChannelResponse {
  channelId: string;
}

interface UseChannelByIdReturn {
  channel: Channel | null;
  isLoading: boolean;
  isCreatingChannel: boolean;
  error: Error | null;
  displayInfo: ChannelDisplayInfo | null;
  startChatChannel: (otherUserId: string) => Promise<void>;
}

export const useChannelById = (
  channelId?: string | undefined
): UseChannelByIdReturn => {
  const { chatClient, userId: currentUserId } = useChat();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [displayInfo, setDisplayInfo] = useState<ChannelDisplayInfo | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient || !channelId || !currentUserId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get the existing channel by ID
        const newChannel = chatClient.channel("messaging", channelId);
        await newChannel.watch();

        setChannel(newChannel);

        // Get display info (name and image)
        const members = Object.values(newChannel.state.members);
        console.log("[ChannelById] currentUserId:", currentUserId);
        console.log(
          "[ChannelById] members:",
          members.map((m) => ({ user_id: m.user_id, name: m.user?.name }))
        );
        const info = getChannelDisplayInfo(newChannel, currentUserId ?? "");
        setDisplayInfo(info);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load channel")
        );
      } finally {
        setIsLoading(false);
      }
    };

    initChannel();

    return () => {
      channel?.stopWatching();
    };
  }, [channelId, chatClient, currentUserId]);

  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const startChatChannel = async (otherUserId: string) => {
    if (isCreatingChannel) return;

    setIsCreatingChannel(true);

    try {
      const response = await apiClient.post<CreateChannelResponse>(
        "/api/v1/chat/channels",
        {
          providerId: otherUserId
        }
      );

      const { channelId } = response.data;

      router.push({
        pathname: "/conversation/[channelId]",
        params: { channelId }
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to start chat";
        Alert.alert("Error", message);
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setIsCreatingChannel(false);
    }
  };

  return {
    channel,
    isLoading,
    error,
    displayInfo,
    startChatChannel,
    isCreatingChannel
  };
};

const getChannelDisplayInfo = (
  channel: Channel,
  currentUserId: string
): ChannelDisplayInfo => {
  const members = Object.values(channel.state.members);

  console.log("👯‍♂️", JSON.stringify(members, null, 2), currentUserId);

  // For DMs (2 members), always use the other member's info
  if (members.length <= 2) {
    const otherMember = members.find(
      (member) => member.user_id !== currentUserId
    );
    return {
      name: otherMember?.user?.name || otherMember?.user_id || "Utilisateur",
      image: otherMember?.user?.image as string | undefined
    };
  }

  // For group chats, use channel name
  if (channel.data && "name" in channel?.data && channel.data?.name) {
    return {
      name: channel.data.name as string,
      image: undefined
    };
  }

  // Fallback for group chats without name
  const otherMember = members.find(
    (member) => member.user_id !== currentUserId
  );
  return {
    name: otherMember?.user?.name || otherMember?.user_id || "Utilisateur",
    image: otherMember?.user?.image as string | undefined
  };
};
