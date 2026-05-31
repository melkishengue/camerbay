import { apiClient } from "@/lib/axios-api-client";
import { Offer, PaginatedOfferResponse } from "@/types/offer";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const LIKED_IDS_KEY = ["liked-ids"];
export const LIKED_OFFERS_KEY = ["liked-offers"];

// ─── Shared liked-IDs cache ───────────────────────────────────────────────────

/**
 * Read-only hook: returns whether a given offer is currently liked.
 * Reads from the shared Set<string> stored in React Query cache.
 */
export const useIsLiked = (offerId: string): boolean => {
  const { data } = useQuery<Set<string>>({
    queryKey: LIKED_IDS_KEY,
    queryFn: () => new Set<string>(),
    staleTime: Infinity,
    gcTime: Infinity
  });
  return data?.has(offerId) ?? false;
};

const addLikedId = (queryClient: ReturnType<typeof useQueryClient>, id: string) => {
  queryClient.setQueryData<Set<string>>(LIKED_IDS_KEY, (prev) => {
    const next = new Set(prev ?? []);
    next.add(id);
    return next;
  });
};

const removeLikedId = (queryClient: ReturnType<typeof useQueryClient>, id: string) => {
  queryClient.setQueryData<Set<string>>(LIKED_IDS_KEY, (prev) => {
    const next = new Set(prev ?? []);
    next.delete(id);
    return next;
  });
};

// ─── Toggle like ──────────────────────────────────────────────────────────────

export const useLikeToggle = () => {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: (offerId: string) =>
      apiClient.post(`/api/v1/offers/${offerId}/like`),
    onMutate: (offerId) => addLikedId(queryClient, offerId),
    onError: (_err, offerId) => removeLikedId(queryClient, offerId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: LIKED_OFFERS_KEY });
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: (offerId: string) =>
      apiClient.delete(`/api/v1/offers/${offerId}/like`),
    onMutate: (offerId) => removeLikedId(queryClient, offerId),
    onError: (_err, offerId) => addLikedId(queryClient, offerId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: LIKED_OFFERS_KEY });
    }
  });

  const toggleLike = useCallback(
    (offerId: string, currentlyLiked: boolean) => {
      if (currentlyLiked) {
        unlikeMutation.mutate(offerId);
      } else {
        likeMutation.mutate(offerId);
      }
    },
    [likeMutation, unlikeMutation]
  );

  return { toggleLike };
};

// ─── Liked offers list ────────────────────────────────────────────────────────

export const useLikedOffers = (enabled = true) => {
  const queryClient = useQueryClient();

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
    queryKey: LIKED_OFFERS_KEY,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.get<PaginatedOfferResponse>(
        `/api/v1/users/me/liked-offers?page=${pageParam}&size=20`
      );
      const data = response.data;
      data.content.forEach((offer) => addLikedId(queryClient, offer.id));
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.pageNumber + 1 : undefined,
    initialPageParam: 0,
    enabled,
    staleTime: 0
  });

  const offers: Offer[] = data?.pages.flatMap((page) => page.content) ?? [];

  const load = useCallback(() => { refetch(); }, [refetch]);
  const refresh = useCallback(async () => { await refetch(); }, [refetch]);
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    offers,
    isLoading: isLoading || isFetchingNextPage,
    isRefreshing: isRefetching && !isFetchingNextPage,
    error: error ? (error as Error).message : null,
    hasMore: !!hasNextPage,
    load,
    refresh,
    loadMore
  };
};
