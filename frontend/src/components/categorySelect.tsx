import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import {
  Button,
  Divider,
  ScrollShadow,
  Select,
  useThemeColor
} from "heroui-native";
import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { Platform, ScrollView, Text, View } from "react-native";

// Categories
const CATEGORIES = [
  { value: "electronics", label: "Électronique", icon: "📱" },
  { value: "furniture", label: "Meubles", icon: "🛋️" },
  { value: "clothing", label: "Vêtements", icon: "👕" },
  { value: "vehicles", label: "Véhicules", icon: "🚗" },
  { value: "real-estate", label: "Immobilier", icon: "🏠" },
  { value: "services", label: "Services", icon: "🔧" },
  { value: "other", label: "Autre", icon: "📦" }
] as const;

export type CategoryOption = (typeof CATEGORIES)[number];
export type Category = CategoryOption["value"];

interface CategorySelectProps {
  control: Control<any>;
  name: string;
  errors?: FieldErrors<any>;
  label?: string;
  description?: string;
  placeholder?: string;
  isRequired?: boolean;
  rules?: any;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  control,
  name,
  errors,
  label = "Catégorie",
  description = "Sélectionnez une catégorie pour affiner votre recherche",
  placeholder = "Sélectionnez une catégorie",
  isRequired = false,
  rules
}) => {
  const [themeColorOverlay] = useThemeColor(["overlay"]);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value } }) => (
        <View className="gap-2">
          <Text className="text-base font-medium text-foreground">
            {label}
            {isRequired && <Text className="text-destructive"> *</Text>}
          </Text>

          <Select
            // presentation={Platform.OS === "ios" ? "bottom-sheet" : "popover"}
            value={value}
            onValueChange={onChange}
          >
            <Select.Trigger asChild>
              <Button variant="secondary" className="w-full justify-between">
                {value ? (
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-base">{value.icon}</Text>
                    <Text className="text-sm text-accent font-medium">
                      {value.label}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-accent">{placeholder}</Text>
                )}
              </Button>
            </Select.Trigger>

            <Select.Portal>
              <Select.Overlay className="bg-black/10" />

              {Platform.OS === "ios" ? (
                // Bottom Sheet for iOS
                <Select.Content
                  presentation="bottom-sheet"
                  snapPoints={["50%", "75%"]}
                  detached
                  enableDynamicSizing={false}
                  enableOverDrag={false}
                  backgroundClassName="bg-transparent shadow-none"
                  handleClassName="h-1"
                  handleIndicatorClassName="w-12 h-[3px]"
                  contentContainerClassName="h-full pt-1 pb-1 mx-2.5 rounded-t-[36px] border border-Divider/20 bg-overlay overflow-hidden"
                  contentContainerProps={{
                    style: {
                      borderCurve: "continuous"
                    }
                  }}
                >
                  <ScrollShadow
                    LinearGradientComponent={LinearGradient}
                    color={themeColorOverlay}
                  >
                    <BottomSheetScrollView
                      contentContainerClassName="p-4"
                      showsVerticalScrollIndicator={false}
                    >
                      {CATEGORIES.map((category, index) => (
                        <React.Fragment key={category.value}>
                          <Select.Item
                            value={category.value}
                            label={category.label}
                            className="py-5 px-3"
                          >
                            <View className="flex-row items-center gap-3 flex-1">
                              <Text className="text-2xl">{category.icon}</Text>
                              <Text className="text-base text-foreground flex-1">
                                {category.label}
                              </Text>
                            </View>
                            <Select.ItemIndicator />
                          </Select.Item>
                          {index < CATEGORIES.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </BottomSheetScrollView>
                  </ScrollShadow>
                </Select.Content>
              ) : (
                // Popover for Android/Web
                <Select.Content
                  presentation="popover"
                  width={300}
                  placement="bottom"
                  align="start"
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 300 }}
                  >
                    {CATEGORIES.map((category, index) => (
                      <React.Fragment key={category.value}>
                        <Select.Item
                          value={category.value}
                          label={category.label}
                          className="py-3 px-3"
                        >
                          <View className="flex-row items-center gap-3 flex-1">
                            <Text className="text-xl">{category.icon}</Text>
                            <Text className="text-base text-foreground flex-1">
                              {category.label}
                            </Text>
                          </View>
                          <Select.ItemIndicator />
                        </Select.Item>
                        {index < CATEGORIES.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </ScrollView>
                </Select.Content>
              )}
            </Select.Portal>
          </Select>

          {description && (
            <Text className="text-sm text-muted mt-1">{description}</Text>
          )}

          {errors?.[name] && (
            <Text className="text-sm text-destructive mt-1">
              {errors[name].message as string}
            </Text>
          )}
        </View>
      )}
    />
  );
};
