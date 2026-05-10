import { FullScreenOfferForm } from "@/components/FullScreenOfferForm";
import { useAuth } from "@/hooks/useAuth";
import { useChannelById } from "@/hooks/useChannelById";
import { Offer } from "@/types/offer";
import { useRouter } from "expo-router";
import { Card, PressableFeedback, useThemeColor } from "heroui-native";
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Star
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

interface OfferCardProps {
  offer: Offer;
  currentUserId?: string;
  onPress?: (offerId: string) => void;
  onBookmark?: (offerId: string) => void;
  onLike?: (offerId: string) => void;
}

const PUBLISHED_MINUTES = 2; // TODO: replace with real value

const ActionDivider = () => (
  <View className="bg-divider w-7" style={{ height: 0.5 }} />
);

const ActionButton = ({
  onPress,
  label,
  children
}: {
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) => (
  <TouchableOpacity
    onPress={(e) => {
      e.stopPropagation();
      onPress();
    }}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    className="flex-1 w-full items-center justify-center"
    accessibilityLabel={label}
  >
    {children}
  </TouchableOpacity>
);

export const OfferCard: React.FC<OfferCardProps> = React.memo(
  ({ offer, currentUserId, onPress, onBookmark, onLike }) => {
    const [
      successColor,
      warningColor,
      dangerColor,
      mutedColor,
      surfaceColor,
      dividerColor
    ] = useThemeColor([
      "success",
      "warning",
      "danger",
      "muted",
      "surface",
      "divider",
      "foreground"
    ]);

    const router = useRouter();
    const { isAuthenticated, login } = useAuth();
    const { startChatChannel } = useChannelById();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    const isOwner = currentUserId != null && currentUserId === offer.providerId;

    const pricingItems = offer.pricingItems ?? [];
    const minPrice =
      pricingItems.length > 1
        ? Math.min(...pricingItems.map((i) => i.price.amount))
        : pricingItems[0]?.price.amount;
    const displayCurrency = pricingItems[0]?.price.currency ?? "";
    const rating = offer.providerRating || 3;

    const priceLabel =
      minPrice != null
        ? `${minPrice.toFixed(0)} ${displayCurrency}`.trim()
        : "Devis";

    const publishedColor =
      PUBLISHED_MINUTES <= 10
        ? successColor
        : PUBLISHED_MINUTES <= 25
          ? warningColor
          : dangerColor;

    const handleEdit = () => setIsEditModalVisible(true);

    const handleMessage = async () => {
      if (!isAuthenticated) {
        login();
        return;
      }
      await startChatChannel(offer.providerId);
    };

    return (
      <>
        <PressableFeedback
          onPress={() => onPress?.(offer.id)}
          className="mb-2.5 rounded-2xl"
        >
          <PressableFeedback.Ripple />
          <Card
            className="overflow-hidden rounded-2xl flex-row items-stretch"
            variant="tertiary"
            style={{
              backgroundColor: surfaceColor,
              borderColor: isOwner ? successColor : dividerColor,
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
                borderRadius: 0,
                backgroundColor: dividerColor
              }}
              resizeMode="cover"
            />

            {/* Body */}
            <View className="flex-1 min-w-0 gap-1.5 p-2.5">
              {/* Title + published */}
              <View className="flex-row items-center justify-between gap-1.5">
                <View className="flex-row items-center gap-1.5 flex-1 min-w-0">
                  {isOwner && (
                    <View
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: successColor }}
                    />
                  )}
                  <Text
                    numberOfLines={1}
                    className="flex-1 text-[13px] text-foreground"
                    style={{ fontFamily: "Inter_600SemiBold" }}
                  >
                    {offer.title}
                  </Text>
                </View>
                <Text
                  className="text-[11.5px] shrink-0"
                  style={{ fontFamily: "Inter_700Bold", color: publishedColor }}
                >
                  {PUBLISHED_MINUTES} min
                </Text>
              </View>

              {/* Stars */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      fill={s <= rating ? warningColor : "transparent"}
                      color={s <= rating ? warningColor : mutedColor}
                      strokeWidth={1.5}
                    />
                  ))}
                </View>
              </View>

              {/* Location + price */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1 flex-1 min-w-0">
                  <MapPin size={11} color={mutedColor} strokeWidth={2} />
                  <Text
                    numberOfLines={1}
                    className="text-[10px] text-muted flex-1"
                    style={{ fontFamily: "Inter_400Regular" }}
                  >
                    {offer.location.address}
                  </Text>
                </View>
                <View
                  className="px-2.25 py-0.75 rounded-full ml-2"
                  style={{ backgroundColor: successColor + "25" }}
                >
                  <Text
                    className="text-[10px]"
                    style={{ fontFamily: "Inter_700Bold", color: successColor }}
                  >
                    {priceLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action strip */}
            <View className="bg-divider" style={{ width: 0.5 }} />
            <View className="w-11 items-center justify-around shrink-0">
              {isOwner ? (
                <ActionButton onPress={handleEdit} label="Modifier">
                  <Pencil size={17} color={successColor} strokeWidth={1.8} />
                </ActionButton>
              ) : (
                <>
                  <ActionButton
                    onPress={() => onBookmark?.(offer.id)}
                    label="Enregistrer"
                  >
                    <Bookmark size={17} color={mutedColor} strokeWidth={1.8} />
                  </ActionButton>
                  <ActionDivider />
                  <ActionButton
                    onPress={() => onLike?.(offer.id)}
                    label="J'aime"
                  >
                    <Heart size={17} color={mutedColor} strokeWidth={1.8} />
                  </ActionButton>
                  <ActionDivider />
                  <ActionButton onPress={handleMessage} label="Message">
                    <MessageCircle
                      size={17}
                      color={mutedColor}
                      strokeWidth={1.8}
                    />
                  </ActionButton>
                </>
              )}
            </View>
          </Card>
        </PressableFeedback>

        {isOwner && (
          <Modal
            visible={isEditModalVisible}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <FullScreenOfferForm
              mode="edit"
              offerId={offer.id}
              initialData={offer}
              onClose={() => setIsEditModalVisible(false)}
            />
          </Modal>
        )}
      </>
    );
  }
);

OfferCard.displayName = "OfferCard";
