import { useChannelById } from "@/hooks/useChannelById";
import { truncateTitle } from "@/lib/utils";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { Avatar, useThemeColor } from "heroui-native";
import { useEffect } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MessageInput,
  MessageList,
  Channel as StreamChannel
} from "stream-chat-expo";

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const navigation = useNavigation();
  const { channel, isLoading, error, displayInfo } = useChannelById(channelId);
  const backgroundColor = useThemeColor("background");
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (displayInfo) {
      navigation.setOptions({
        headerTitle: truncateTitle(displayInfo.name, 20),
        headerRight: () => {
          if (displayInfo.image) {
            return (
              <Avatar alt="User profile">
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

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !channel) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">
            Erreur lors du chargement du chat
          </Text>
          {error ? (
            <Text className="text-muted">{error?.message}</Text>
          ) : (
            <Text className="text-muted">Canal introuvable</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StreamChannel channel={channel as any} disableKeyboardCompatibleView>
        <MessageList />
        <MessageInput />
      </StreamChannel>
    </KeyboardAvoidingView>
  );
}
