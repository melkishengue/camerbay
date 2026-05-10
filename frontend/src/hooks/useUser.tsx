import { apiClient } from "@/lib/axios-api-client";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { BackendUser } from "./useAuth";

interface UseUserOptions {
  userId?: string;
  fetchOnMount?: boolean;
  showErrorAlert?: boolean;
}

interface UseUserReturn {
  user: BackendUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getUser: (userId: string) => Promise<BackendUser | undefined>;
}

// Simple in-memory cache to avoid refetching the same user
const userCache = new Map<string, { data: BackendUser; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useUser = (options?: UseUserOptions | string): UseUserReturn => {
  // Support both string userId and options object for backwards compatibility
  const userId = typeof options === "string" ? options : options?.userId;
  const fetchOnMount =
    typeof options === "object" ? options.fetchOnMount !== false : true;
  const showErrorAlert =
    typeof options === "object" ? options.showErrorAlert !== false : true;

  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUser = useCallback(
    async (
      targetUserId: string,
      options?: { useCache?: boolean; silent?: boolean }
    ) => {
      const useCache = options?.useCache !== false;
      const silent = options?.silent || false;

      // Check cache first
      if (useCache) {
        const cached = userCache.get(targetUserId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setUser(cached.data);
          setError(null);
          return cached.data;
        }
      }

      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await apiClient.get<BackendUser>(
          `/api/v1/users/${targetUserId}`
        );

        const userData = response.data;

        // Update cache
        userCache.set(targetUserId, {
          data: userData,
          timestamp: Date.now()
        });

        setUser(userData);
        return userData;
      } catch (err) {
        const errorMessage = isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch user"
          : "Something went wrong. Please try again.";

        setError(errorMessage);
        setUser(null);


        if (showErrorAlert && !silent) {
          Alert.alert("Error", errorMessage);
        }

        return undefined;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [showErrorAlert]
  );

  const refetch = useCallback(async () => {
    if (!userId) {
      console.warn("Cannot refetch: no userId provided");
      return;
    }
    await getUser(userId, { useCache: false });
  }, [userId, getUser]);

  // Auto-fetch on mount if userId is provided
  useEffect(() => {
    if (userId && fetchOnMount) {
      getUser(userId);
    }
  }, [userId, fetchOnMount, getUser]);

  return {
    user,
    loading,
    error,
    refetch,
    getUser
  };
};

// Helper hook for fetching multiple users
export const useUsers = (userIds: string[]) => {
  const [users, setUsers] = useState<Map<string, BackendUser>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (userIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const promises = userIds.map(async (id) => {
        // Check cache first
        const cached = userCache.get(id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return { id, data: cached.data };
        }

        const response = await apiClient.get<BackendUser>(
          `/api/v1/users/${id}`
        );
        userCache.set(id, { data: response.data, timestamp: Date.now() });
        return { id, data: response.data };
      });

      const results = await Promise.all(promises);
      const userMap = new Map(results.map(({ id, data }) => [id, data]));
      setUsers(userMap);
    } catch (err) {
      const errorMessage = isAxiosError(err)
        ? err.response?.data?.message || "Failed to fetch users"
        : "Something went wrong. Please try again.";

      setError(errorMessage);

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userIds]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
};

// Utility to clear cache
export const clearUserCache = (userId?: string) => {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
};
