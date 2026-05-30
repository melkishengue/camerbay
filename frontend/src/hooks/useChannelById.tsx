import { apiClient } from "@/lib/axios-api-client";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

interface ChannelDisplayInfo {
  name: string;
  image?: string;
}

interface ConversationSummary {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
    imageUrl?: string;
  } | null;
}

interface UseChannelByIdReturn {
  conversationId: string | null;
  isLoading: boolean;
  isCreatingChannel: boolean;
  error: Error | null;
  displayInfo: ChannelDisplayInfo | null;
  startChatChannel: (otherUserId: string) => Promise<void>;
}

export const useChannelById = (channelId?: string): UseChannelByIdReturn => {
  const [conversationId, setConversationId] = useState<string | null>(channelId ?? null);
  const [isLoading, setIsLoading] = useState(!!channelId);
  const [error, setError] = useState<Error | null>(null);
  const [displayInfo, setDisplayInfo] = useState<ChannelDisplayInfo | null>(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!channelId) {
      setIsLoading(false);
      return;
    }

    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<ConversationSummary[]>("/api/v1/chat/conversations");
        const conv = response.data.find((c) => c.id === channelId);
        if (conv?.otherParticipant) {
          setDisplayInfo({
            name: conv.otherParticipant.name,
            image: conv.otherParticipant.imageUrl,
          });
        }
        setConversationId(channelId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load conversation"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [channelId]);

  const startChatChannel = async (otherUserId: string) => {
    if (isCreatingChannel) return;
    setIsCreatingChannel(true);
    try {
      const response = await apiClient.post<ConversationSummary>("/api/v1/chat/conversations", {
        otherUserId,
      });
      const { id } = response.data;
      router.push({
        pathname: "/conversation/[channelId]",
        params: { channelId: id },
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message || "Impossible de démarrer la conversation";
        Alert.alert("Erreur", message);
      } else {
        Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsCreatingChannel(false);
    }
  };

  return {
    conversationId,
    isLoading,
    isCreatingChannel,
    error,
    displayInfo,
    startChatChannel,
  };
};
