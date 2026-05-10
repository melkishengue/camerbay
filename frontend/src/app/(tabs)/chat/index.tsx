import { LoginPrompt } from "@/components/LoginPrompt";
import ScreenContainer from "@/components/screenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useRouter } from "expo-router";
import { Spinner } from "heroui-native";
import { MessageCircleCode } from "lucide-react-native";
import { View } from "react-native";
import { ChannelList } from "stream-chat-expo";

export default function InboxScreen() {
  const { isAuthenticated } = useAuth();
  const { chatClient } = useChat();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        icon={<MessageCircleCode size={50} color="#0ea5e9" />}
        title="Vos messages"
        description="Connectez-vous pour échanger avec des professionnels et suivre vos conversations."
      />
    );
  }

  if (!chatClient?.userID) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      </ScreenContainer>
    );
  }

  const filters = {
    members: { $in: [chatClient.userID] },
    type: "messaging"
  };

  return (
    <ScreenContainer>
      <ChannelList
        filters={filters}
        sort={{ last_message_at: -1 }}
        onSelect={(channel) => {
          router.push({
            pathname: "/(tabs)/chat/[channelId]",
            params: { channelId: channel.id as string }
          });
        }}
      />
    </ScreenContainer>
  );
}
