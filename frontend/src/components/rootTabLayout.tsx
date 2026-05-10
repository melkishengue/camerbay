import NotificationBell from "@/components/NotificationBell";
import { useAppTheme } from "@/contexts/app-theme-context";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { ReactNode, useCallback } from "react";
import { Platform } from "react-native";

export default function RootTabLayout({ children }: { children: ReactNode }) {
  const renderNotificationBell = useCallback(() => <NotificationBell />, []);
  const [themeColorForeground, themeColorBackground] = useThemeColor([
    "foreground",
    "background"
  ]);
  const { isDark } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerTransparent: true,
        headerBlurEffect: isDark ? "dark" : "light",
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold"
        },
        headerRight: renderNotificationBell,
        headerBackTitle: "Retour",
        headerTintColor: themeColorForeground,
        headerStyle: {
          backgroundColor: Platform.select({
            ios: "transparent",
            android: themeColorBackground + "E6"
          })
        },
        headerBackButtonDisplayMode: "default"
      }}
    >
      {children}
    </Stack>
  );
}
