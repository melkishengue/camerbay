import { apiClient } from "@/lib/axios-api-client";
import { Offer, PaginatedOfferResponse } from "@/types/offer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

const LIKED_IDS_KEY = ["liked-ids"];

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
    onError: (_err, offerId) => removeLikedId(queryClient, offerId)
  });

  const unlikeMutation = useMutation({
    mutationFn: (offerId: string) =>
      apiClient.delete(`/api/v1/offers/${offerId}/like`),
    onMutate: (offerId) => removeLikedId(queryClient, offerId),
    onError: (_err, offerId) => addLikedId(queryClient, offerId)
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

export const useLikedOffers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    async (pageNum: number, replace = false) => {
      try {
        if (replace) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = await apiClient.get<PaginatedOfferResponse>(
          `/api/v1/users/me/liked-offers?page=${pageNum}&size=20`
        );

        const data = response.data;

        // Sync fetched IDs into the shared liked-IDs cache
        data.content.forEach((offer) => addLikedId(queryClient, offer.id));

        if (replace) {
          setAllOffers(data.content);
        } else {
          setAllOffers((prev) =>
            pageNum === 0 ? data.content : [...prev, ...data.content]
          );
        }
        setHasMore(data.hasNext ?? false);
        setPage(pageNum);
      } catch (e: any) {
        setError(e?.message ?? "Erreur lors du chargement");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [queryClient]
  );

  const refresh = useCallback(() => fetchPage(0, true), [fetchPage]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPage(page + 1);
    }
  }, [isLoading, hasMore, page, fetchPage]);

  const load = useCallback(() => fetchPage(0), [fetchPage]);

  return {
    offers: allOffers,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    load,
    refresh,
    loadMore
  };
};
