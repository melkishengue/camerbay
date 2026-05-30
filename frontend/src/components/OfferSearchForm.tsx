// components/OfferSearchForm.tsx
import { Place } from "@/hooks/useCitySearch";
import { Category } from "@/types/category";
import Slider from "@react-native-community/slider";
import { Button, TextField, useThemeColor } from "heroui-native";
import { MapPin, Search, SlidersHorizontal, Tag, X } from "lucide-react-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { CategorySelect } from "./categorySelect-v2";
import { CityAutocomplete } from "./cityAutoComplete";
import { SectionBlock } from "./sectionBlock";

export interface SearchFormData {
  searchQuery: string;
  category?: Category;
  city?: Place | null;
  radius: number;
}

interface OfferSearchFormProps {
  initialValues?: Partial<SearchFormData>;
  onSearch: (filters: SearchFormData) => void;
  showCategory?: boolean;
}

export const OfferSearchForm: React.FC<OfferSearchFormProps> = ({
  initialValues,
  onSearch,
  showCategory = true
}) => {
  const [themeColorAccent, themeColorAccentForeground, themeColorMuted] =
    useThemeColor(["accent", "accent-foreground", "muted"]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SearchFormData>({
    defaultValues: {
      searchQuery: initialValues?.searchQuery || "",
      category: initialValues?.category,
      city: initialValues?.city || null,
      radius: initialValues?.radius || 10
    }
  });

  const onSubmit = (data: SearchFormData) => {
    onSearch({
      searchQuery: data.searchQuery.trim(),
      category: data.category,
      city: data.city,
      radius: data.radius
    });
  };

  const handleReset = () => {
    reset({
      searchQuery: "",
      category: undefined,
      city: null,
      radius: 10
    });
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Query */}
        <SectionBlock
          title="Recherche"
          icon={<Search size={11} color={themeColorAccent} strokeWidth={2.5} />}
        >
          <Controller
            control={control}
            name="searchQuery"
            rules={{
              required: false,
              minLength: {
                value: 2,
                message: "Minimum 2 caractères"
              }
            }}
            render={({ field: { onChange, value } }) => (
              <TextField isInvalid={!!errors.searchQuery}>
                <TextField.Input
                  placeholder="Que recherchez-vous ?"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.searchQuery && (
                  <TextField.ErrorMessage>
                    {errors.searchQuery.message}
                  </TextField.ErrorMessage>
                )}
              </TextField>
            )}
          />
        </SectionBlock>

        {/* Category */}
        {showCategory && (
          <SectionBlock
            title="Catégorie"
            icon={<Tag size={11} color={themeColorAccent} strokeWidth={2.5} />}
          >
            <CategorySelect
              control={control}
              name="category"
              errors={errors}
              label=""
              required={false}
              placeholder="Sélectionnez une catégorie"
              showAllOption
            />
          </SectionBlock>
        )}

        {/* Location */}
        <SectionBlock
          title="Localisation"
          icon={<MapPin size={11} color={themeColorAccent} strokeWidth={2.5} />}
        >
          <CityAutocomplete
            control={control}
            name="city"
            errors={errors}
            label=""
            description=""
            placeholder="Entrez le nom d'une ville..."
            countryCode="DE"
            radiusKm={2}
            isRequired={false}
          />
        </SectionBlock>

        {/* Radius */}
        <SectionBlock
          title="Rayon de recherche"
          icon={
            <SlidersHorizontal
              size={11}
              color={themeColorAccent}
              strokeWidth={2.5}
            />
          }
        >
          <Controller
            control={control}
            name="radius"
            render={({ field: { onChange, value } }) => (
              <View className="gap-3">
                <View className="flex-row justify-between items-center">
                  <Text
                    className="text-muted"
                    style={{ fontSize: 12, fontFamily: "Inter_400Regular" }}
                  >
                    Distance autour de la ville
                  </Text>
                  <View
                    style={{
                      backgroundColor: themeColorAccent,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 99,
                      shadowColor: themeColorAccent,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: 4
                    }}
                  >
                    <Text
                      style={{
                        color: themeColorAccentForeground,
                        fontSize: 12,
                        fontFamily: "Inter_700Bold"
                      }}
                    >
                      {value} km
                    </Text>
                  </View>
                </View>

                <Slider
                  value={value}
                  onValueChange={onChange}
                  minimumValue={0}
                  maximumValue={1000}
                  step={10}
                  minimumTrackTintColor={themeColorAccent}
                  maximumTrackTintColor={themeColorMuted}
                  thumbTintColor={themeColorAccent}
                  style={{ height: 36 }}
                />

                <View className="flex-row justify-between">
                  <Text
                    className="text-muted"
                    style={{ fontSize: 11, fontFamily: "Inter_400Regular" }}
                  >
                    0 km
                  </Text>
                  <Text
                    className="text-muted"
                    style={{ fontSize: 11, fontFamily: "Inter_400Regular" }}
                  >
                    1000 km
                  </Text>
                </View>
              </View>
            )}
          />
        </SectionBlock>

        {/* Fixed Action Buttons */}
        <View className="p-4 border-t border-border bg-background gap-2">
          <Button variant="primary" onPress={handleSubmit(onSubmit)}>
            <Search
              size={20}
              color={themeColorAccentForeground}
              strokeWidth={2}
            />
            <Button.Label
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }}
            >
              Rechercher
            </Button.Label>
          </Button>

          <Button variant="ghost" onPress={handleReset}>
            <X size={20} color={themeColorMuted} strokeWidth={2} />
            <Button.Label
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }}
            >
              Réinitialiser
            </Button.Label>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};
