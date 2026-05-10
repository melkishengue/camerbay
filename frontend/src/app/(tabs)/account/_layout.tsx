import RootTabLayout from "@/components/rootTabLayout";
import { Stack } from "expo-router";

export default function AccountLayout() {
  return (
    <RootTabLayout>
      <Stack.Screen
        name="index"
        options={{
          title: "Mon Compte",
          headerShown: true
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: "Onboarding",
          headerShown: true,
          presentation: "card"
        }}
      />
      <Stack.Screen
        name="legal-terms"
        options={{
          title: "Conditions d'utilisation",
          headerShown: true,
          headerBackTitle: "Retour"
        }}
      />
      <Stack.Screen
        name="legal-privacy"
        options={{
          title: "Confidentialité",
          headerShown: true,
          headerBackTitle: "Retour"
        }}
      />
      <Stack.Screen
        name="legal-notices"
        options={{
          title: "Mentions légales",
          headerShown: true,
          headerBackTitle: "Retour"
        }}
      />
    </RootTabLayout>
  );
}
