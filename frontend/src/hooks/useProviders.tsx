import { apiClient } from "@/lib/axios-api-client";
import {
  ProviderFilters,
  ProviderListResponse,
  ProviderPublicProfile
} from "@/types/provider";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

const buildQueryString = (page: number, filters?: ProviderFilters): string => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: "20"
  });

  if (filters?.searchText) {
    params.append("searchText", filters.searchText);
  }
  if (filters?.latitude) {
    params.append("latitude", String(filters.latitude));
  }
  if (filters?.longitude) {
    params.append("longitude", String(filters.longitude));
  }
  if (filters?.radiusKm) {
    params.append("radiusKm", String(filters.radiusKm));
  }

  return params.toString();
};

export const useProviders = (initialFilters?: ProviderFilters) => {
  const [filters, setFilters] = useState<ProviderFilters | undefined>(
    initialFilters
  );

  const {
    data,
    isLoading,
    isRefetching,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ["providers", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const queryString = buildQueryString(pageParam, filters);
      const response = await apiClient.getPublic<ProviderListResponse>(
        `/api/v1/users/search?${queryString}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.pageNumber + 1 : undefined,
    initialPageParam: 0
  });

  const providers: ProviderPublicProfile[] = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data]
  );

  const fetchProviders = useCallback(
    (newFilters?: ProviderFilters) => {
      if (newFilters !== undefined) {
        setFilters(newFilters);
      } else {
        refetch();
      }
    },
    [refetch]
  );

  const refreshProviders = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    providers,
    isLoading: isLoading || isFetchingNextPage,
    isRefreshing: isRefetching && !isFetchingNextPage,
    error: error ? (error as Error).message : null,
    hasMore: !!hasNextPage,
    fetchProviders,
    refreshProviders,
    loadMore
  };
};
