import { OfferForm } from "@/components/offerForm";
import { useErrorToast } from "@/hooks/useErrorToast";
import { useOffer } from "@/hooks/useOffer";
import { Offer, OfferFormResult, UpdateOfferRequest } from "@/types/offer";
import { useToast } from "heroui-native";
import React, { useState } from "react";
import { Alert } from "react-native";
import { FullScreenModal } from "./FullScreenModal";

interface FullScreenOfferFormProps {
  title?: string;
  submitLabel?: string;
  initialData?: Offer;
  onClose?: () => void;
  mode?: "create" | "edit";
  offerId?: string;
}

export const FullScreenOfferForm: React.FC<FullScreenOfferFormProps> = ({
  title,
  submitLabel,
  initialData,
  onClose,
  mode = "create",
  offerId
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const { showError } = useErrorToast();
  const { createOffer, updateOffer, isCreating, isUpdating } =
    useOffer(initialData);

  const isSubmitting = mode === "create" ? isCreating : isUpdating;

  const handleSubmit = async (data: OfferFormResult) => {
    if (!data.categoryId) {
      Alert.alert("Erreur", "Veuillez sélectionner une catégorie");
      return;
    }

    try {
      if (mode === "edit" && offerId) {

        const updateData: UpdateOfferRequest = {
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          pricingItems: data.pricingItems,
          photos: data.photos
        };

        await updateOffer(updateData);
      } else {
        await createOffer(data);
      }

      onClose?.();

      toast.show({
        duration: 1000,
        variant: "success",
        label: mode === "edit" ? "Offre modifiée" : "Offre créée",
        actionLabel: "Fermer",
        onActionPress: ({ hide }) => hide()
      });
    } catch (error) {
      showError(error);
    }
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <FullScreenModal
      title={
        title || (mode === "edit" ? "Modifier l'offre" : "Créer une offre")
      }
      onClose={onClose}
      hasChanges={hasChanges}
      showSaveButton={false} // OfferForm has its own buttons
    >
      <OfferForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitLabel={
          submitLabel || (mode === "edit" ? "Enregistrer" : "Créer une offre")
        }
      />
    </FullScreenModal>
  );
};
