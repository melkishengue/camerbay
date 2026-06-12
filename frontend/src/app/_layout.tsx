import { initSentry, Sentry } from "@/lib/sentry";
import { queryClient } from "@/lib/queryClient";
import { ErrorFallback } from "@/components/ErrorFallback";
import { QueryClientProvider } from "@tanstack/react-query";

initSentry();
import { AuthProvider } from "@/hooks/useAuth";
import { ChatProvider } from "@/hooks/useChat";
import { NotificationCenterProvider } from "@/hooks/useNotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import {
  HeroUINativeProvider,
  ToastProvider,
  useThemeColor
} from "heroui-native";
import React, { useCallback } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel
} from "react-native-reanimated";
import "../../global.css";
import { ThemeToggle } from "../components/theme-toggle";
import { AppThemeProvider } from "../contexts/app-theme-context";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false
});

function NotificationSetup() {
  useNotifications();
  return null;
}

function AppContent() {
  const contentWrapper = useCallback(
    (children: React.ReactNode) => (
      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={12}
        style={{ flex: 1 }}
      >
        {children}
      </KeyboardAvoidingView>
    ),
    []
  );

  const [themeColorForeground, themeColorBackground] = useThemeColor([
    "foreground",
    "background"
  ]);

  const _renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <HeroUINativeProvider
      config={{
        toast: {
          contentWrapper
        },
        devInfo: {
          stylingPrinciples: false
        }
      }}
    >
      <ToastProvider>
          <AuthProvider>
            <ChatProvider>
            <NotificationCenterProvider>
              <NotificationSetup />
              <Stack
                screenOptions={{
                  headerTitleAlign: "center",
                  headerTransparent: true,
                  headerTintColor: themeColorForeground,
                  headerStyle: {
                    backgroundColor: Platform.select({
                      ios: undefined,
                      android: themeColorBackground
                    })
                  },
                  headerTitleStyle: {
                    fontFamily: "Inter_600SemiBold"
                  },
                  headerRight: _renderThemeToggle,
                  headerBackButtonDisplayMode: "default",
                  gestureEnabled: true,
                  gestureDirection: "horizontal",
                  contentStyle: {
                    backgroundColor: themeColorBackground
                  }
                }}
              >
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    // headerTransparent: true,
                    title: "Camerbay",
                    headerBackVisible: true
                  }}
                />
                <Stack.Screen
                  name="conversation/[channelId]"
                  options={{
                    headerShown: true,
                    headerBackTitle: "Retour",
                    title: "",
                    headerTransparent: false,
                    headerBlurEffect: undefined,
                    headerStyle: {
                      backgroundColor: Platform.select({
                        ios: themeColorBackground,
                        android: themeColorBackground
                      })
                    }
                  }}
                />
                <Stack.Screen
                  name="notifications"
                  options={{
                    headerShown: true,
                    headerBackTitle: "Retour",
                    title: "Notifications"
                  }}
                />
                <Stack.Screen
                  name="offers/[id]"
                  options={{
                    headerShown: true,
                    headerBackTitle: "Retour",
                    title: ""
                  }}
                />
                <Stack.Screen
                  name="login"
                  options={{
                    headerShown: true,
                    headerBackTitle: "Retour",
                    title: "Se connecter",
                    presentation: "modal"
                  }}
                />
              </Stack>
            </NotificationCenterProvider>
            </ChatProvider>
          </AuthProvider>
        </ToastProvider>
    </HeroUINativeProvider>
  );
}

function Layout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error as Error} resetError={resetError} />
      )}
    >
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.root}>
          <AppThemeProvider>
            <AppContent />
          </AppThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(Layout);

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
