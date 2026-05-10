import { apiClient } from "@/lib/axios-api-client";
import { Offer } from "@/types/offer";
import { useQuery } from "@tanstack/react-query";

export const useOfferDetails = (offerId: string) => {
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const response = await apiClient.getPublic<Offer>(
        `/api/v1/offers/${offerId}`
      );
      return response.data;
    },
    enabled: !!offerId
  });

  return {
    offer: data ?? null,
    isLoading,
    isRefreshing: isRefetching,
    error: error ? (error as Error).message : null,
    fetchOffer: refetch,
    refetch
  };
};
