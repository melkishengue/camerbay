import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Bell } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function NotificationBell() {
  const { unreadCount } = useNotificationCenter();
  const [foreground, dangerColor] = useThemeColor(["foreground", "danger"]);

  return (
    <Pressable
      onPress={() => router.push("/notifications")}
      hitSlop={8}
      style={styles.container}
    >
      <Bell size={22} color={foreground} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: dangerColor }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    padding: 4
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 12
  }
});
