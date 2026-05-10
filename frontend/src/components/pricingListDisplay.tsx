import { PricingItem } from "@/types/offer";
import { useThemeColor } from "heroui-native";
import { MessageCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface PricingListDisplayProps {
  pricingItems?: PricingItem[];
}

export function PricingListDisplay({ pricingItems }: PricingListDisplayProps) {
  const [accentColor] = useThemeColor(["accent"]);

  if (!pricingItems || pricingItems.length === 0) {
    return (
      <View
        className="bg-surface border border-border rounded-2xl"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          padding: 16
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: accentColor + "18"
          }}
        >
          <MessageCircle size={22} color={accentColor} strokeWidth={1.75} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            className="text-foreground"
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 14 }}
          >
            Prix sur devis
          </Text>
          <Text
            className="text-muted"
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 3
            }}
          >
            Contactez le prestataire pour un tarif personnalisé
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-surface border border-border rounded-2xl overflow-hidden">
      {pricingItems.map((item, index) => (
        <View key={index}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 14
            }}
          >
            {/* Left accent bar */}
            <View
              style={{
                width: 3,
                height: 32,
                borderRadius: 99,
                backgroundColor: accentColor,
                opacity: 0.7
              }}
            />
            <Text
              style={{
                flex: 1,
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                lineHeight: 20
              }}
              className="text-foreground"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 15,
                color: accentColor
              }}
            >
              {item.price.amount.toLocaleString()} {item.price.currency}
            </Text>
          </View>

          {index < pricingItems.length - 1 && (
            <View
              className="bg-border"
              style={{ height: 1, marginHorizontal: 16 }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
