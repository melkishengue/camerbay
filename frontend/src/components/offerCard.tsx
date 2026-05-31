import { FullScreenOfferForm } from "@/components/FullScreenOfferForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { useChannelById } from "@/hooks/useChannelById";
import { Offer } from "@/types/offer";
import { Card, PressableFeedback, useThemeColor } from "heroui-native";
import { useIsLiked } from "@/hooks/useLikes";
import {
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
  onLike?: (offerId: string, currentlyLiked: boolean) => void;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  const intervals = [
    { label: "an", labelPlural: "ans", seconds: 31536000 },
    { label: "mois", labelPlural: "mois", seconds: 2592000 },
    { label: "semaine", labelPlural: "semaines", seconds: 604800 },
    { label: "jour", labelPlural: "jours", seconds: 86400 },
    { label: "heure", labelPlural: "heures", seconds: 3600 },
    { label: "minute", labelPlural: "minutes", seconds: 60 },
    { label: "seconde", labelPlural: "secondes", seconds: 1 }
  ];

  for (const { label, labelPlural, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) {
      return `il y a ${count} ${count !== 1 ? labelPlural : label}`;
    }
  }

  return "à l'instant";
}

const ActionDivider = () => (
  <View />
  // <View className="bg-divider w-7" style={{ height: 0.5 }} />
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
  ({ offer, currentUserId, onPress, onLike }) => {
    const [successColor, warningColor, mutedColor, surfaceColor, dividerColor] =
      useThemeColor([
        "success",
        "warning",
        "muted",
        "surface",
        "divider",
        "foreground"
      ]);

    const { isAuthenticated, login } = useAuth();
    const { startChatChannel } = useChannelById();
    const router = useRouter();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const isLiked = useIsLiked(offer.id);

    const isOwner = currentUserId != null && currentUserId === offer.providerId;

    const pricingItems = offer.pricingItems ?? [];
    const minPrice =
      pricingItems.length > 0
        ? Math.min(...pricingItems.map((i) => i.price.amount))
        : undefined;
    const displayCurrency = pricingItems[0]?.price.currency ?? "";
    const rating = offer.providerRating || 3;

    const priceLabel =
      minPrice != null
        ? `${minPrice.toFixed(0)} ${displayCurrency}`.trim()
        : "Devis";

    const handleEdit = () => setIsEditModalVisible(true);

    const handleLike = () => {
      if (!isAuthenticated) {
        login();
        return;
      }
      onLike?.(offer.id, isLiked);
    };

    const handleProviderPress = () => {
      router.push(`/(tabs)/offers/provider/${offer.providerId}`);
    };

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
                borderRadius: 5,
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
                    className="flex-1 text-lg text-foreground font-bold"
                  >
                    {offer.title}
                  </Text>
                </View>
                <Text className="shrink-0 text-accent">
                  {timeAgo(offer.createdAt)}
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
                    className="text-[11px] text-muted flex-1"
                  >
                    {offer.location.address.replace(", Germany", "")}
                  </Text>
                </View>
                <View
                  className="px-2.25 py-0.75 rounded-full ml-2"
                  style={{ backgroundColor: successColor + "25" }}
                >
                  <Text className="text-[10px] font-bold text-success">
                    {priceLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action strip */}
            <View className="bg-divider" style={{ width: 0.5 }} />
            <View className="w-10 items-center justify-around shrink-0">
              {isOwner ? (
                <ActionButton onPress={handleEdit} label="Modifier">
                  <Pencil size={17} color={successColor} strokeWidth={1.8} />
                </ActionButton>
              ) : (
                <>
                  <ActionButton onPress={handleLike} label="J'aime">
                    <Heart
                      size={17}
                      color={isLiked ? "#ef4444" : mutedColor}
                      fill={isLiked ? "#ef4444" : "transparent"}
                      strokeWidth={1.8}
                    />
                  </ActionButton>
                  <ActionDivider />
                  <ActionButton onPress={handleMessage} label="Message">
                    <MessageCircle
                      size={17}
                      color={mutedColor}
                      strokeWidth={1.8}
                    />
                  </ActionButton>
                  <ActionDivider />
                  <ActionButton
                    onPress={handleProviderPress}
                    label="Prestataire"
                  >
                    {offer.providerPhotoImageUrl ? (
                      <Image
                        source={{ uri: offer.providerPhotoImageUrl }}
                        style={{ width: 22, height: 22, borderRadius: 11 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: successColor,
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 9,
                            fontFamily: "Inter_600SemiBold"
                          }}
                        >
                          {(
                            offer.providerName ??
                            offer.providerBusinessName ??
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
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
