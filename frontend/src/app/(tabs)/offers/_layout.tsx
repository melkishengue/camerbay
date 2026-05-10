import RootTabLayout from "@/components/rootTabLayout";
import { Stack } from "expo-router";

export default function OffersLayout() {
  return (
    <RootTabLayout>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Offres"
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerShown: true,
          presentation: "card"
        }}
      />
      <Stack.Screen
        name="provider/[id]"
        options={{
          title: "Profil du prestataire",
          headerShown: true,
          presentation: "card"
        }}
      />
    </RootTabLayout>
  );
}
