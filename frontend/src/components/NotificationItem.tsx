import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { AppNotification, NotificationType } from "@/types/notification";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import {
  Bell,
  MapPin,
  Megaphone,
  MessageCircle,
  RefreshCw,
  Star,
  Tag
} from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const ICON_MAP: Record<
  NotificationType,
  React.ComponentType<{ size: number; color: string }>
> = {
  chat_message: MessageCircle,
  new_offer: Tag,
  new_offer_nearby: MapPin,
  offer_status_change: RefreshCw,
  offer_review: Star,
  system_announcement: Megaphone
};

function getRelativeTime(dateString: string): string {
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(dateString) ? dateString : `${dateString}Z`;
  const now = Date.now();
  const date = new Date(normalized).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return new Date(normalized).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short"
  });
}

function navigateToNotification(notification: AppNotification) {
  const { type, data } = notification;
  switch (type) {
    case "chat_message":
      if (data?.channelId) router.push(`/conversation/${data.channelId}`);
      break;
    case "new_offer":
    case "new_offer_nearby":
    case "offer_status_change":
    case "offer_review":
      if (data?.offerId) router.push(`/offers/${data.offerId}`);
      break;
    default:
      break;
  }
}

export default function NotificationItem({
  notification
}: {
  notification: AppNotification;
}) {
  const { markAsRead } = useNotificationCenter();
  const [foreground, mutedForeground, primaryColor] =
    useThemeColor(["foreground", "muted", "accent"]);

  const Icon = ICON_MAP[notification.type] ?? Bell;
  const avatarUrl = notification.data?.senderAvatarUrl;

  const handlePress = async () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    navigateToNotification(notification);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        !notification.read && { backgroundColor: primaryColor + "18" },
        pressed && { opacity: 0.7 }
      ]}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View
          style={[styles.iconContainer, { backgroundColor: primaryColor + "20" }]}
        >
          <Icon size={20} color={primaryColor} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: foreground },
              !notification.read && styles.titleUnread
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={[styles.time, { color: mutedForeground }]}>
            {getRelativeTime(notification.createdAt)}
          </Text>
        </View>
        <Text
          style={[styles.body, { color: mutedForeground }]}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
      </View>
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: primaryColor }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  content: {
    flex: 1,
    gap: 2
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1
  },
  titleUnread: {
    fontFamily: "Inter_600SemiBold"
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular"
  },
  body: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  }
});
