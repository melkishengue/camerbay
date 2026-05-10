import { OfferForm } from "@/components/offerForm";
import { CreateOfferRequest, Offer, PricingItem } from "@/types/offer";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useThemeColor } from "heroui-native";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef
} from "react";
import { Pressable, Text, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledView = withUniwind(View);
const StyledPressable = withUniwind(Pressable);
const StyledText = withUniwind(Text);
const StyledIonicons = withUniwind(Ionicons);

export interface OfferBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface OfferBottomSheetProps {
  title?: string;
  submitLabel?: string;
  initialData?: Offer;
  onSubmit: (data: CreateOfferRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export const OfferBottomSheet = forwardRef<
  OfferBottomSheetRef,
  OfferBottomSheetProps
>(
  (
    {
      title = "Créer une offre",
      submitLabel,
      initialData,
      onSubmit,
      isSubmitting = false
    },
    ref
  ) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const themeColorBackground = useThemeColor("background");
    const themeColorForeground = useThemeColor("foreground");

    const snapPoints = useMemo(() => ["95%"], []);

    const handleSheetChanges = useCallback((index: number) => {}, []);

    const handleClose = useCallback(() => {
      bottomSheetModalRef.current?.dismiss();
    }, []);

    const handleCancel = useCallback(() => {
      bottomSheetModalRef.current?.dismiss();
    }, []);

    // Expose present/dismiss methods to parent via ref
    useImperativeHandle(ref, () => ({
      present: () => bottomSheetModalRef.current?.present(),
      dismiss: () => bottomSheetModalRef.current?.dismiss()
    }));

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose={false}
        enableDismissOnClose={true}
        backgroundStyle={{ backgroundColor: themeColorBackground }}
        handleIndicatorStyle={{ display: "none" }}
      >
        {/* Header with Close Button */}
        <StyledView className="flex-row items-center justify-between px-4 py-4 border-b border-border bg-background">
          <StyledPressable
            onPress={handleClose}
            className="w-10 h-10 justify-center items-start"
          >
            <StyledIonicons
              name="close"
              size={28}
              color={themeColorForeground}
            />
          </StyledPressable>

          <StyledText className="text-lg font-semibold text-foreground flex-1 text-center">
            {title}
          </StyledText>

          <StyledView className="w-10" />
        </StyledView>

        <BottomSheetScrollView
          // contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <StyledView>
            <OfferForm
              initialData={initialData}
              onSubmit={async (data) => {
                await onSubmit(data);
                bottomSheetModalRef.current?.dismiss();
              }}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitLabel={submitLabel}
            />
          </StyledView>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

OfferBottomSheet.displayName = "OfferBottomSheet";
