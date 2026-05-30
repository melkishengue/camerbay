import { ProviderPublicProfile } from "@/types/provider";
import { Card, PressableFeedback, useThemeColor } from "heroui-native";
import { MapPin, Star } from "lucide-react-native";
import React from "react";
import { Image, Text, View } from "react-native";

interface ProviderCardProps {
  provider: ProviderPublicProfile;
  onPress?: (providerId: string) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = React.memo(
  ({ provider, onPress }) => {
    const [warningColor, mutedColor, surfaceColor, dividerColor] =
      useThemeColor(["warning", "muted", "surface", "divider"]);

    const displayName =
      provider.businessName || provider.name || provider.username;
    const rating = provider.averageRating || 0;

    return (
      <PressableFeedback
        onPress={() => onPress?.(provider.id)}
        className="mb-2.5 rounded-2xl"
      >
        <PressableFeedback.Ripple />
        <Card
          className="overflow-hidden rounded-2xl flex-row items-center"
          variant="tertiary"
          style={{
            backgroundColor: surfaceColor,
            borderColor: dividerColor,
            borderWidth: 0.5
          }}
        >
          {/* Avatar */}
          <View className="p-3">
            <Image
              source={{
                uri:
                  provider.profilePhotoUrl ||
                  "https://via.placeholder.com/56x56"
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: dividerColor
              }}
              resizeMode="cover"
            />
          </View>

          {/* Body */}
          <View className="flex-1 min-w-0 gap-1 py-3 pr-3">
            <Text
              numberOfLines={1}
              className="text-base text-foreground font-bold"
            >
              {displayName}
            </Text>

            {provider.description ? (
              <Text numberOfLines={2} className="text-[12px] text-muted">
                {provider.description}
              </Text>
            ) : null}

            <View className="flex-row items-center justify-between mt-1">
              <View className="flex-row items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    fill={s <= rating ? warningColor : "transparent"}
                    color={s <= rating ? warningColor : mutedColor}
                    strokeWidth={1.5}
                  />
                ))}
                <Text className="text-[11px] text-muted ml-1">
                  ({provider.totalReviewsCount})
                </Text>
              </View>

              {provider.city ? (
                <View className="flex-row items-center gap-1">
                  <MapPin size={11} color={mutedColor} strokeWidth={2} />
                  <Text numberOfLines={1} className="text-[11px] text-muted">
                    {provider.city}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card>
      </PressableFeedback>
    );
  }
);

ProviderCard.displayName = "ProviderCard";
