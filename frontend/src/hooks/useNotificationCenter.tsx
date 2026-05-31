import { apiClient } from "@/lib/axios-api-client";
import {
  AppNotification,
  NotificationListResponse
} from "@/types/notification";
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo
} from "react";
import { AppState } from "react-native";
import { useAuth } from "./useAuth";

interface NotificationCenterContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationCenterContext = createContext<
  NotificationCenterContextType | undefined
>(undefined);

export function NotificationCenterProvider({
  children
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.get<NotificationListResponse>(
        `/api/v1/notifications?page=${pageParam}&size=20`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages - 1
        ? lastPage.currentPage + 1
        : undefined,
    initialPageParam: 0,
    enabled: isAuthenticated
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>(
        "/api/v1/notifications/unread-count"
      );
      return response.data.count;
    },
    enabled: isAuthenticated
  });

  // Sync badge count
  useEffect(() => {
    Notifications.setBadgeCountAsync(unreadCount);
  }, [unreadCount]);

  // Refresh unread count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && isAuthenticated) {
        queryClient.invalidateQueries({
          queryKey: ["notifications-unread-count"]
        });
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, queryClient]);

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data]
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    await refetch();
    queryClient.invalidateQueries({
      queryKey: ["notifications-unread-count"]
    });
  }, [refetch, queryClient]);

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic updates — instant UI feedback before API round-trip
      queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              content: page.content.map((n) =>
                n.id === id ? { ...n, read: true } : n
              )
            }))
          };
        }
      );
      queryClient.setQueryData<number>(
        ["notifications-unread-count"],
        (old) => Math.max(0, (old ?? 1) - 1)
      );

      await apiClient.put(`/api/v1/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"]
      });
    },
    [queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic updates
    queryClient.setQueryData<InfiniteData<NotificationListResponse>>(
      ["notifications"],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.map((n) => ({ ...n, read: true }))
          }))
        };
      }
    );
    queryClient.setQueryData<number>(["notifications-unread-count"], 0);

    await apiClient.put("/api/v1/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({
      queryKey: ["notifications-unread-count"]
    });
  }, [queryClient]);

  const value: NotificationCenterContextType = {
    notifications,
    unreadCount,
    isLoading: isLoading || isFetchingNextPage,
    hasMore: !!hasNextPage,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationCenter must be used within a NotificationCenterProvider"
    );
  }
  return context;
}
