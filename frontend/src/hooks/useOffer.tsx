import { apiClient } from "@/lib/axios-api-client";
import { queryClient } from "@/lib/queryClient";
import { CreateOfferRequest, Offer, UpdateOfferRequest } from "@/types/offer";
import { useMutation } from "@tanstack/react-query";

export const useOffer = (offer?: Offer | null) => {
  const createMutation = useMutation({
    mutationFn: async (data: CreateOfferRequest): Promise<Offer> => {
      const response = await apiClient.post<Offer>("/api/v1/offers", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateOfferRequest): Promise<Offer> => {
      if (!offer?.id) {
        throw new Error("Offer ID is required for update");
      }
      const response = await apiClient.patch<Offer>(
        `/api/v1/offers/${offer.id}`,
        data
      );
      return response.data;
    },
    onSuccess: (updatedOffer) => {
      if (offer?.id) {
        queryClient.setQueryData(["offer", offer.id], updatedOffer);
      }
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!offer?.id) {
        throw new Error("Offer ID is required for deletion");
      }
      await apiClient.delete(`/api/v1/offers/${offer.id}`);
    },
    onSuccess: () => {
      if (offer?.id) {
        queryClient.removeQueries({ queryKey: ["offer", offer.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    }
  });

  const createOffer = async (data: CreateOfferRequest): Promise<Offer> => {
    console.log("💆‍♀️", JSON.stringify(data, null, 2));
    return createMutation.mutateAsync(data);
  };

  const updateOffer = async (data: UpdateOfferRequest): Promise<Offer> => {
    return updateMutation.mutateAsync(data);
  };

  const activateOffer = async (): Promise<Offer> => {
    return updateOffer({ active: true });
  };

  const deactivateOffer = async (): Promise<Offer> => {
    return updateOffer({ active: false });
  };

  const deleteOffer = async (): Promise<void> => {
    return deleteMutation.mutateAsync();
  };

  return {
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error:
      createMutation.error?.message ??
      updateMutation.error?.message ??
      deleteMutation.error?.message ??
      null,
    createOffer,
    updateOffer,
    activateOffer,
    deactivateOffer,
    deleteOffer
  };
};
