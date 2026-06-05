import { FullScreenOfferForm } from "@/components/FullScreenOfferForm";
import { Offer } from "@/types/offer";
import { Card, PressableFeedback, useThemeColor } from "heroui-native";
import { MapPin, Pencil } from "lucide-react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

interface MyOfferCardProps {
  offer: Offer;
  onOfferUpdated?: () => void;
}

export const MyOfferCard: React.FC<MyOfferCardProps> = React.memo(
  ({ offer, onOfferUpdated }) => {
    const [successColor, mutedColor, surfaceColor, dividerColor, dangerColor] =
      useThemeColor(["success", "muted", "surface", "divider", "danger"]);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const router = useRouter();

    const pricingItems = offer.pricingItems ?? [];
    const minPrice =
      pricingItems.length > 0
        ? Math.min(...pricingItems.map((i) => i.price.amount))
        : undefined;
    const displayCurrency = pricingItems[0]?.price.currency ?? "";
    const priceLabel =
      minPrice != null
        ? `${minPrice.toFixed(0)} ${displayCurrency}`.trim()
        : "Devis";

    const handleClose = () => {
      setIsEditModalVisible(false);
      onOfferUpdated?.();
    };

    return (
      <>
        <PressableFeedback
          onPress={() => router.push(`/(tabs)/account/offers/${offer.id}`)}
          className="mb-2.5 rounded-2xl"
        >
          <PressableFeedback.Ripple />
          <Card
            className="overflow-hidden rounded-2xl flex-row items-stretch"
            variant="tertiary"
            style={{
              backgroundColor: surfaceColor,
              borderColor: offer.active ? successColor + "60" : dividerColor,
              borderWidth: 0.5
            }}
          >
            {/* Thumbnail */}
            <Image
              source={{
                uri: offer.photos?.[0] || "https://via.placeholder.com/72x90"
              }}
              style={{
                width: 72,
                borderRadius: 5,
                backgroundColor: dividerColor,
                opacity: offer.active ? 1 : 0.5
              }}
              resizeMode="cover"
            />

            {/* Body */}
            <View className="flex-1 min-w-0 gap-1.5 p-2.5">
              {/* Title + status badge */}
              <View className="flex-row items-center justify-between gap-1.5">
                <Text
                  numberOfLines={1}
                  className="flex-1 text-base text-foreground font-bold"
                >
                  {offer.title}
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: offer.active
                      ? successColor + "20"
                      : dangerColor + "18"
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: "Inter_600SemiBold",
                      color: offer.active ? successColor : dangerColor
                    }}
                  >
                    {offer.active ? "Actif" : "Inactif"}
                  </Text>
                </View>
              </View>

              {/* Category */}
              <Text
                numberOfLines={1}
                className="text-[11px] text-muted"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {offer.category?.name ?? ""}
              </Text>

              {/* Location + price */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1 flex-1 min-w-0">
                  <MapPin size={10} color={mutedColor} strokeWidth={2} />
                  <Text numberOfLines={1} className="text-[10px] text-muted flex-1">
                    {offer.location.city}
                  </Text>
                </View>
                <View
                  className="px-2 py-0.5 rounded-full ml-2"
                  style={{ backgroundColor: successColor + "20" }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: successColor }}
                  >
                    {priceLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Edit strip */}
            <View className="bg-divider" style={{ width: 0.5 }} />
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setIsEditModalVisible(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-10 items-center justify-center shrink-0"
              accessibilityLabel="Modifier l'offre"
            >
              <Pencil size={15} color={mutedColor} strokeWidth={1.8} />
            </TouchableOpacity>
          </Card>
        </PressableFeedback>

        <Modal
          visible={isEditModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <FullScreenOfferForm
            mode="edit"
            offerId={offer.id}
            initialData={offer}
            onClose={handleClose}
          />
        </Modal>
      </>
    );
  }
);

MyOfferCard.displayName = "MyOfferCard";
