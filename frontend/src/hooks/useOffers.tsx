import { apiClient } from "@/lib/axios-api-client";
import { Offer, OfferFilters, OfferListResponse } from "@/types/offer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

const buildQueryString = (
  page: number,
  appliedFilters?: OfferFilters
): string => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: "20"
  });

  if (appliedFilters?.categoryId) {
    params.append("categoryId", appliedFilters.categoryId);
  }
  if (appliedFilters?.searchText) {
    params.append("searchText", appliedFilters.searchText);
  }
  if (appliedFilters?.latitude) {
    params.append("latitude", String(appliedFilters.latitude));
  }
  if (appliedFilters?.longitude) {
    params.append("longitude", String(appliedFilters.longitude));
  }
  if (appliedFilters?.radiusKm) {
    params.append("radiusKm", String(appliedFilters.radiusKm));
  }

  return params.toString();
};

export const useOffers = (initialFilters?: OfferFilters) => {
  const [filters, setFilters] = useState<OfferFilters | undefined>(
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
    queryKey: ["offers", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const queryString = buildQueryString(pageParam, filters);
      const response = await apiClient.getPublic<OfferListResponse>(
        `/api/v1/offers/search?${queryString}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages - 1
        ? lastPage.currentPage + 1
        : undefined,
    initialPageParam: 0
  });

  const offers: Offer[] = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data]
  );

  const fetchOffers = useCallback(
    (newFilters?: OfferFilters) => {
      if (newFilters !== undefined) {
        setFilters(newFilters);
      } else {
        refetch();
      }
    },
    [refetch]
  );

  const refreshOffers = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const currentPage = data?.pages.at(-1)?.currentPage ?? 0;
  const totalPages = data?.pages.at(-1)?.totalPages ?? 0;

  return {
    offers,
    isLoading: isLoading || isFetchingNextPage,
    isRefreshing: isRefetching && !isFetchingNextPage,
    error: error ? (error as Error).message : null,
    hasMore: !!hasNextPage,
    currentPage,
    totalPages,
    fetchOffers,
    refreshOffers,
    loadMore
  };
};
