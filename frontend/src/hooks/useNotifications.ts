import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { apiClient } from "@/lib/axios-api-client";
import { chatEvents } from "@/lib/chatEvents";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

// Set up Android notification channel
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Notifications",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C"
  });
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined // Uses the project ID from app.json automatically
  });

  return tokenData.data;
}

function navigateFromNotification(
  type: string | undefined,
  data: Record<string, string> | undefined
) {
  switch (type) {
    case "chat_message":
      if (data?.channelId) {
        router.push(`/conversation/${data.channelId}`);
      }
      break;
    case "new_offer":
    case "new_offer_nearby":
    case "offer_status_change":
    case "offer_review":
      if (data?.offerId) {
        router.push(`/(tabs)/offers/${data.offerId}`);
      }
      break;
    default:
      router.push("/notifications");
      break;
  }
}

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register push token
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        try {
          await SecureStore.setItemAsync("expo_push_token", token);
          await apiClient.post("/api/v1/users/me/push-token", {
            expoPushToken: token,
            platform: Platform.OS
          });
        } catch (error) {
          console.warn("Failed to register push token:", error);
        }
      }
    });

    // Handle notification taps when app is open or backgrounded
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { type, ...data } =
          (response.notification.request.content.data as Record<
            string,
            string
          >) ?? {};
        navigateFromNotification(type, data);
      });

    // Handle foreground notifications — update in-app state without requiring a tap
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = (notification.request.content.data ?? {}) as Record<string, string>;
        if (data.type === "chat_message" && data.channelId) {
          chatEvents.emit(data.channelId);
        }
        // Refresh unread count and notification list for all notification types
        queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    );

    // Handle cold start — check if app was opened via notification tap
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const { type, ...data } =
          (response.notification.request.content.data as Record<
            string,
            string
          >) ?? {};
        navigateFromNotification(type, data);
      }
    });

    return () => {
      responseListener.current?.remove();
      foregroundSub.remove();
    };
  }, [isAuthenticated, queryClient]);
}
