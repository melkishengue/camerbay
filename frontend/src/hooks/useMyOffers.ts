import { apiClient } from "@/lib/axios-api-client";
import { useAuth } from "@/hooks/useAuth";
import { Offer } from "@/types/offer";
import { useQuery } from "@tanstack/react-query";

export const useMyOffers = () => {
  const { isAuthenticated, user } = useAuth();

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["my-offers"],
    queryFn: async () => {
      const response = await apiClient.get<Offer[]>("/api/v1/offers/my-offers");
      return response.data;
    },
    enabled: isAuthenticated && !!user?.isProvider
  });

  return {
    offers: data ?? [],
    isLoading: isLoading || isRefetching,
    error: error ? (error as Error).message : null,
    refetch
  };
};
