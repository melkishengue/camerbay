import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadChatMessages } from "@/hooks/useChatUnreadMessages";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useThemeColor } from "heroui-native";
import { MessageCircleCode, Search, User, List } from "lucide-react-native";
import React, { useCallback, useEffect } from "react";
import { Platform } from "react-native";

export default function TabsLayout() {
  const [tabBarInactiveTintColor, backgroundColor, highlightColor] =
    useThemeColor(["muted", "background", "accent"]);

  const [themeColorForeground, themeColorBackground] = useThemeColor([
    "foreground",
    "background"
  ]);

  const pathname = usePathname();
  const { loading, user } = useAuth();
  const router = useRouter();
  const { isChatLoggedIn, unreadCount } = useUnreadChatMessages();

  useEffect(() => {
    if (loading) return;

    if (pathname?.includes("onboarding")) return;

    const onboardingCompleted = user?.onBoardingCompleted === true;

    if (user && !onboardingCompleted) {
      const timeoutId = setTimeout(() => {
        router.replace("/(tabs)/account/onboarding");
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [user, user?.onBoardingCompleted, loading, pathname]);

  return (
    <Tabs
      initialRouteName="offers"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: highlightColor,
        tabBarInactiveTintColor,
        // headerRight: _renderThemeToggle,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: useThemeColor("border"),
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 60,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Inter_500Medium"
        },
        tabBarIconStyle: {
          marginTop: 4
        },

        headerTitleAlign: "center",
        headerTransparent: true,
        headerTintColor: themeColorForeground,
        headerStyle: {
          // height: 105,
          backgroundColor: Platform.select({
            ios: undefined,
            android: themeColorBackground
          })
        },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold"
        },
        headerBackButtonDisplayMode: "default"
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="offers"
        options={{
          title: "Offres",
          tabBarIcon: ({ color, focused }) => (
            <List size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          )
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <MessageCircleCode
              size={24}
              color={color as any}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarBadge:
            isChatLoggedIn && unreadCount > 0 ? unreadCount : undefined
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Mon compte",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          )
        }}
      />
    </Tabs>
  );
}
