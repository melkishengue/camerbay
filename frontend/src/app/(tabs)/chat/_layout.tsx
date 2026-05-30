import RootTabLayout from "@/components/rootTabLayout";
import { useThemeColor } from "heroui-native";
import { Stack } from "expo-router";

function ChatLayout() {
  const backgroundColor = useThemeColor("background");
  const foregroundColor = useThemeColor("foreground");

  return (
    <RootTabLayout>
      <Stack.Screen
        name="index"
        options={{ title: "Messages", headerShown: true }}
      />
      <Stack.Screen
        name="[channelId]"
        options={{
          headerShown: true,
          headerBackTitle: "Retour",
          title: "", // Set dynamically in the screen
          headerTransparent: false,
          headerBlurEffect: undefined,
          headerStyle: { backgroundColor },
          headerTintColor: foregroundColor
        }}
      />
    </RootTabLayout>
  );
}

export default ChatLayout;
