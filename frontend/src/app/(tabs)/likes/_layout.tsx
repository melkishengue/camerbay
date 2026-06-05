import RootTabLayout from "@/components/rootTabLayout";
import { Stack } from "expo-router";

export default function LikesLayout() {
  return (
    <RootTabLayout>
      <Stack.Screen
        name="index"
        options={{
          title: "Favoris",
          headerShown: true
        }}
      />
      <Stack.Screen
        name="offers/[id]"
        options={{
          headerShown: true,
          headerBackTitle: "Retour"
        }}
      />
    </RootTabLayout>
  );
}
