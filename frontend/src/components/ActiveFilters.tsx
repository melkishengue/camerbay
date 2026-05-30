// components/ActiveFilters.tsx
import { Chip, useThemeColor } from "heroui-native";
import { MapPin, Ruler, Search, Tag, X } from "lucide-react-native";
import React from "react";
import { ScrollView, View } from "react-native";
import { SearchFormData } from "./OfferSearchForm";

interface ActiveFiltersProps {
  filters: Partial<SearchFormData>;
  onClearAll: () => void;
  onPress: () => void;
  onClearFilter: (key: keyof SearchFormData) => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onClearAll,
  onPress,
  onClearFilter
}) => {
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const hasActiveFilters =
    filters.searchQuery ||
    filters.category ||
    filters.city ||
    (filters.radius && filters.radius !== 10);

  if (!hasActiveFilters) return null;

  return (
    <View className="pb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-2"
      >
        {filters.searchQuery && (
          <Chip variant="primary" size="md" onPress={onPress}>
            <Search size={13} color={accentForeground} strokeWidth={2} />
            <Chip.Label>{filters.searchQuery}</Chip.Label>
            <X
              size={13}
              color={accentForeground}
              strokeWidth={2.5}
              onPress={() => onClearFilter("searchQuery")}
            />
          </Chip>
        )}

        {filters.category && (
          <Chip variant="primary" size="md" onPress={onPress}>
            <Tag size={13} color={accentForeground} strokeWidth={2} />
            <Chip.Label>{filters.category?.title}</Chip.Label>
            <X
              size={13}
              color={accentForeground}
              strokeWidth={2.5}
              onPress={() => onClearFilter("category")}
            />
          </Chip>
        )}

        {filters.city && (
          <Chip variant="primary" size="md" onPress={onPress}>
            <MapPin size={13} color={accentForeground} strokeWidth={2} />
            <Chip.Label>{filters.city.name}</Chip.Label>
            <X
              size={13}
              color={accentForeground}
              strokeWidth={2.5}
              onPress={() => onClearFilter("city")}
            />
          </Chip>
        )}

        {filters.radius && filters.radius !== 10 && (
          <Chip variant="primary" size="md" onPress={onPress}>
            <Ruler size={13} color={accentForeground} strokeWidth={2} />
            <Chip.Label>{filters.radius} km</Chip.Label>
            <X
              size={13}
              color={accentForeground}
              strokeWidth={2.5}
              onPress={() => onClearFilter("radius")}
            />
          </Chip>
        )}
      </ScrollView>
    </View>
  );
};
