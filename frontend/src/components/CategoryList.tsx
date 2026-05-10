import { Category } from "@/types/category";
import { useThemeColor } from "heroui-native";
import { Tag } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

// Decorative palette — no semantic token equivalent for per-category colors
const CATEGORY_STYLES = [
  { bg: "#065f46", icon: "#ffffff" },
  { bg: "#9d174d", icon: "#ffffff" },
  { bg: "#92400e", icon: "#ffffff" },
  { bg: "#1e40af", icon: "#ffffff" },
  { bg: "#5b21b6", icon: "#ffffff" },
  { bg: "#991b1b", icon: "#ffffff" },
  { bg: "#155e75", icon: "#ffffff" },
  { bg: "#9a3412", icon: "#ffffff" },
  { bg: "#14532d", icon: "#ffffff" },
  { bg: "#701a75", icon: "#ffffff" },
];

interface CategoryListProps {
  categories: Category[];
  selectedId?: string | null;
  onSelect: (category: Category | null) => void;
}

function CategoryItem({
  label,
  bg,
  iconColor,
  labelColor,
  selected,
  onPress,
}: {
  label: string;
  bg: string;
  iconColor: string;
  labelColor: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", width: 50 }}>
      {({ pressed }) => (
        <>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 20,
              backgroundColor: bg,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.75 : 1,
              borderWidth: selected ? 2 : 0,
              borderColor: iconColor,
            }}
          >
            <Tag size={24} color={iconColor} strokeWidth={1.6} />
          </View>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 11,
              fontFamily: "Inter_600SemiBold",
              color: labelColor,
              marginTop: 5,
              textAlign: "center",
              lineHeight: 14,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function CategoryList({
  categories,
  selectedId,
  onSelect,
}: CategoryListProps) {
  const [defaultBg, defaultFg, muted] = useThemeColor([
    "default",
    "default-foreground",
    "muted",
  ]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 6, paddingBottom: 10, gap: 8 }}
    >
      <CategoryItem
        label="Tout"
        bg={defaultBg}
        iconColor={defaultFg}
        labelColor={muted}
        selected={selectedId == null}
        onPress={() => onSelect(null)}
      />
      {categories.map((cat, index) => {
        const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
        return (
          <CategoryItem
            key={cat.id}
            label={cat.title || cat.name}
            bg={style.bg}
            iconColor={style.icon}
            labelColor={style.icon}
            selected={selectedId === cat.id}
            onPress={() => onSelect(selectedId === cat.id ? null : cat)}
          />
        );
      })}
    </ScrollView>
  );
}
