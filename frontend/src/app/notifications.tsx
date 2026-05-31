import NotificationItem from "@/components/NotificationItem";
import ScreenContainer from "@/components/screenContainer";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { AppNotification } from "@/types/notification";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

function MarkAllReadButton() {
  const { markAllAsRead, unreadCount } = useNotificationCenter();
  const [primaryColor] = useThemeColor(["primary"]);

  if (unreadCount === 0) return null;

  return (
    <Pressable onPress={markAllAsRead} hitSlop={8}>
      <Text style={[styles.markAllText, { color: primaryColor }]}>
        Tout lire
      </Text>
    </Pressable>
  );
}

function EmptyState() {
  const [mutedColor] = useThemeColor(["default-400"]);

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: mutedColor }]}>
        Aucune notification
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const { notifications, isLoading, hasMore, loadMore, refresh } =
    useNotificationCenter();
  const [foreground] = useThemeColor(["foreground"]);

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationItem notification={item} />
    ),
    []
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }, [hasMore]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notifications",
          headerBackTitle: "Retour",
          headerRight: () => <MarkAllReadButton />
        }}
      />
      <ScreenContainer>
        {isLoading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={foreground} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            extraData={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={EmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            onRefresh={refresh}
            refreshing={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium"
  },
  markAllText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold"
  },
  footer: {
    paddingVertical: 20
  }
});
