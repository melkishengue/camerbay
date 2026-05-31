import { useChannelById } from "@/hooks/useChannelById";
import { useChat } from "@/hooks/useChat";
import { apiClient } from "@/lib/axios-api-client";
import { chatEvents } from "@/lib/chatEvents";
import { truncateTitle } from "@/lib/utils";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { Avatar, useThemeColor } from "heroui-native";
import { SendHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BackendMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  senderImageUrl: string | null;
  text: string;
  createdAt: string;
  isRead: boolean;
}

interface MessagesPage {
  content: BackendMessage[];
  last: boolean;
  number: number;
}

function formatTime(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const { userId } = useChat();
  const { displayInfo, isLoading, error } = useChannelById(channelId);
  const backgroundColor = useThemeColor("background");
  const foregroundColor = useThemeColor("foreground");
  const borderColor = useThemeColor("background-tertiary");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const accentForegroundColor = useThemeColor("accent-foreground");

  const [messages, setMessages] = useState<BackendMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (displayInfo) {
      navigation.setOptions({
        headerTitle: truncateTitle(displayInfo.name, 20),
        headerRight: () => {
          if (displayInfo.image) {
            return (
              <Avatar alt="User profile" size="sm">
                <Avatar.Image source={{ uri: displayInfo.image }} />
                <Avatar.Fallback />
              </Avatar>
            );
          }
          return null;
        }
      });
    }
  }, [displayInfo, navigation]);

  const fetchMessages = useCallback(
    async (page: number, silent = false) => {
      if (!channelId) return;
      if (!silent) setLoadingMessages(true);
      try {
        const response = await apiClient.get<MessagesPage>(
          `/api/v1/chat/conversations/${channelId}/messages`,
          { params: { page, size: 30 } }
        );
        const incoming = response.data.content.filter(
          (m) => !knownIdsRef.current.has(m.id)
        );
        incoming.forEach((m) => knownIdsRef.current.add(m.id));

        if (page === 0) {
          setMessages(response.data.content);
          setHasMore(!response.data.last);
        } else {
          setMessages((prev) => [...prev, ...incoming]);
          setHasMore(!response.data.last);
        }
      } catch {
        // silent
      } finally {
        setLoadingMessages(false);
        setIsLoadingEarlier(false);
      }
    },
    [channelId]
  );

  const pollNewMessages = useCallback(async () => {
    if (!channelId) return;
    try {
      const response = await apiClient.get<MessagesPage>(
        `/api/v1/chat/conversations/${channelId}/messages`,
        { params: { page: 0, size: 30 } }
      );
      const incoming = response.data.content.filter(
        (m) => !knownIdsRef.current.has(m.id)
      );
      if (incoming.length > 0) {
        incoming.forEach((m) => knownIdsRef.current.add(m.id));
        setMessages((prev) => [...incoming, ...prev]);
      }
    } catch {
      // silent
    }
  }, [channelId]);

  const markAsRead = useCallback(async () => {
    if (!channelId) return;
    try {
      await apiClient.put(`/api/v1/chat/conversations/${channelId}/read`);
    } catch {
      // silent
    }
  }, [channelId]);

  useEffect(() => {
    if (!channelId || !userId) return;
    pageRef.current = 0;
    knownIdsRef.current = new Set();
    fetchMessages(0);
    markAsRead();
    intervalRef.current = setInterval(pollNewMessages, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [channelId, userId]);

  useEffect(() => {
    if (!channelId) return;
    return chatEvents.subscribe((incomingChannelId) => {
      if (incomingChannelId === channelId) {
        pollNewMessages();
        markAsRead();
      }
    });
  }, [channelId, pollNewMessages, markAsRead]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !channelId || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: BackendMessage = {
      id: tempId,
      senderId: userId ?? "",
      senderName: null,
      senderImageUrl: null,
      text,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setInputText("");
    setMessages((prev) => [optimistic, ...prev]);
    knownIdsRef.current.add(tempId);

    try {
      const response = await apiClient.post<BackendMessage>(
        `/api/v1/chat/conversations/${channelId}/messages`,
        { text }
      );
      knownIdsRef.current.add(response.data.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? response.data : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      knownIdsRef.current.delete(tempId);
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, channelId, userId, sending]);

  const onLoadEarlier = useCallback(() => {
    if (isLoadingEarlier || !hasMore) return;
    setIsLoadingEarlier(true);
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchMessages(nextPage);
  }, [isLoadingEarlier, hasMore, fetchMessages]);

  if (isLoading || loadingMessages) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: mutedColor }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">
            Erreur lors du chargement du chat
          </Text>
          <Text style={{ color: mutedColor }}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        onEndReached={onLoadEarlier}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          isLoadingEarlier ? (
            <Text
              style={{ color: mutedColor, textAlign: "center", padding: 8 }}
            >
              Chargement...
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const isMe = item.senderId === userId;
          return (
            <View
              style={{
                flexDirection: "row",
                justifyContent: isMe ? "flex-end" : "flex-start",
                marginVertical: 3
              }}
            >
              <View
                style={{
                  maxWidth: "75%",
                  backgroundColor: isMe ? accentColor : borderColor,
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  paddingHorizontal: 12,
                  paddingVertical: 8
                }}
              >
                <Text
                  style={{
                    color: isMe ? accentForegroundColor : foregroundColor,
                    fontSize: 15
                  }}
                >
                  {item.text}
                </Text>
                <Text
                  style={{
                    color: isMe ? accentForegroundColor : mutedColor,
                    opacity: isMe ? 0.6 : 1,
                    fontSize: 11,
                    marginTop: 2,
                    alignSelf: "flex-end"
                  }}
                >
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          backgroundColor
        }}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Écrire un message..."
          placeholderTextColor={mutedColor}
          multiline
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            backgroundColor: borderColor,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 15,
            color: foregroundColor,
            marginRight: 8
          }}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: inputText.trim() ? accentColor : borderColor,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <SendHorizontal
            size={20}
            color={inputText.trim() ? "#fff" : mutedColor}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
