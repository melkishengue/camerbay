import RootTabLayout from "@/components/rootTabLayout";
import { Stack } from "expo-router";

export default function ChatLayout() {
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
          title: "" // Set dynamically in the screen
        }}
      />
    </RootTabLayout>
  );
}
