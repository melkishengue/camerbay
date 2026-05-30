import { LoginPrompt } from "@/components/LoginPrompt";
import ScreenContainer from "@/components/screenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { apiClient } from "@/lib/axios-api-client";
import { chatEvents } from "@/lib/chatEvents";
import { useRouter } from "expo-router";
import { Spinner } from "heroui-native";
import { MessageCircleCode } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";

interface Participant {
  id: string;
  name: string;
  imageUrl?: string;
}

interface ConversationItem {
  id: string;
  otherParticipant: Participant | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function formatTime(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return DAYS_FR[date.getDay()];
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function InboxScreen() {
  const { isAuthenticated } = useAuth();
  const { userId } = useChat();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await apiClient.get<ConversationItem[]>("/api/v1/chat/conversations");
      setConversations(response.data);
    } catch {
      // silently fail on background polls
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchConversations();
    intervalRef.current = setInterval(() => fetchConversations(true), 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [userId, fetchConversations]);

  useEffect(() => {
    if (!userId) return;
    return chatEvents.subscribe(() => fetchConversations(true));
  }, [userId, fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        icon={<MessageCircleCode size={50} color="#0ea5e9" />}
        title="Vos messages"
        description="Connectez-vous pour échanger avec des professionnels et suivre vos conversations."
      />
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-muted text-center">Aucune conversation pour l'instant</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "/(tabs)/chat/[channelId]", params: { channelId: item.id } })
            }
            className="flex-row items-center px-4 py-3 border-b border-border"
          >
            {item.otherParticipant?.imageUrl ? (
              <Image
                source={{ uri: item.otherParticipant.imageUrl }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
                <Text className="text-foreground font-semibold text-lg">
                  {item.otherParticipant?.name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
            <View className="flex-1 ml-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-foreground font-semibold" numberOfLines={1}>
                  {item.otherParticipant?.name ?? "Utilisateur"}
                </Text>
                <Text className="text-muted text-xs">{formatTime(item.lastMessageAt)}</Text>
              </View>
              <View className="flex-row justify-between items-center mt-0.5">
                <Text className="text-muted text-sm flex-1" numberOfLines={1}>
                  {item.lastMessageText ?? "Démarrer la conversation"}
                </Text>
                {item.unreadCount > 0 && (
                  <View className="bg-accent rounded-full min-w-5 h-5 items-center justify-center ml-2 px-1">
                    <Text className="text-white text-xs font-bold">
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
