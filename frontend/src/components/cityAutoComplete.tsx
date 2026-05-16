/* eslint-disable react-hooks/rules-of-hooks */
import * as Location from "expo-location";
import { Button, Divider, Spinner, TextField } from "heroui-native";
import { Search, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  UIManager,
  View
} from "react-native";
import { Place, useCitySearch } from "../hooks/useCitySearch";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CityAutocompleteProps {
  control: Control<any>;
  name: string;
  errors?: FieldErrors<any>;
  placeholder?: string;
  countryCode?: string;
  radiusKm?: number;
  baseUrl?: string;
  className?: string;
  label?: string;
  description?: string;
  isRequired?: boolean;
  rules?: any;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  control,
  name,
  errors,
  placeholder = "Rechercher une ville...",
  countryCode = "DE",
  radiusKm = 2,
  className = "",
  description,
  isRequired = false,
  rules
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const lastSyncedValue = useRef<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  const {
    searchByName,
    cities,
    isLoading,
    error: _searchError,
    searchByLocation,
    nearbyCities,
    isLoadingNearby,
    nearbyError,
    clearSearch
  } = useCitySearch({
    countryCode,
    radiusKm,
    debounceMs: 300,
    limit: 15
  });

  const openModal = useCallback(() => {
    setQuery("");
    clearSearch();
    setIsModalOpen(true);
  }, [clearSearch]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setQuery("");
    clearSearch();
    Keyboard.dismiss();
  }, [clearSearch]);

  const handleTextChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim()) {
        searchByName(text);
      } else {
        clearSearch();
      }
    },
    [searchByName, clearSearch]
  );

  const handleCitySelect = useCallback(
    (city: Place, onChange: (value: Place) => void) => {
      lastSyncedValue.current = city.name;
      setShowValidationError(false);
      onChange(city);
      clearSearch();
      closeModal();
    },
    [clearSearch, closeModal]
  );

  const handleClearInput = (onChange: (value: Place | null) => void) => {
    lastSyncedValue.current = null;
    setShowValidationError(false);
    clearSearch();
    onChange(null);
  };

  const handleUseCurrentLocation = async (onChange: (value: Place) => void) => {
    try {
      setIsFetchingLocation(true);

      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à votre localisation est nécessaire. Veuillez autoriser l'accès dans les paramètres."
        );
        setIsFetchingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      await searchByLocation(
        location.coords.latitude,
        location.coords.longitude
      );

      setIsFetchingLocation(false);
    } catch {
      setIsFetchingLocation(false);
      Alert.alert(
        "Erreur",
        "Impossible d'obtenir votre localisation. Veuillez réessayer."
      );
    }
  };

  const fieldError = errors?.[name];
  const hasError = !!fieldError || showValidationError;

  const validationRules = {
    ...rules,
    required: isRequired ? rules?.required || "Ce champ est requis" : false
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      render={({ field: { onChange, value } }) => {
        // Auto-select nearest city when location search completes

        useEffect(() => {
          if (nearbyCities.length > 0 && !isLoadingNearby) {
            const nearest = nearbyCities[0];
            handleCitySelect(nearest, onChange);
            setIsFetchingLocation(false);
          }
        }, [nearbyCities, isLoadingNearby]);

        // Sync lastSyncedValue when value changes externally
        useEffect(() => {
          if (value?.name) {
            lastSyncedValue.current = value.name;
          } else if (!value) {
            lastSyncedValue.current = null;
          }
        }, [value]);

        return (
          <View className={className}>
            <TextField isRequired={isRequired} isInvalid={hasError}>
              {/* Label row */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-medium text-foreground">
                  Ville
                </Text>
                <Button
                  onPress={() => handleUseCurrentLocation(onChange)}
                  isDisabled={isFetchingLocation}
                  size="sm"
                  variant="ghost"
                >
                  {isFetchingLocation
                    ? "Localisation..."
                    : "📍 Utiliser ma position"}
                </Button>
              </View>

              {/* Trigger — tapping opens the search modal */}
              <Pressable
                onPress={openModal}
                className={`w-full flex-row items-center justify-between px-3 py-2 rounded-2xl border-2 bg-field shadow-field ${
                  hasError ? "border-danger" : "border-field"
                }`}
                style={{ borderCurve: "continuous" }}
              >
                <Text
                  className={`flex-1 text-base ${
                    value?.name ? "text-foreground" : "text-muted"
                  }`}
                  numberOfLines={1}
                >
                  {value?.name ?? placeholder}
                </Text>

                {isFetchingLocation ? (
                  <Spinner size="sm" color="#9ca3af" />
                ) : value?.name ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleClearInput(onChange);
                    }}
                    hitSlop={8}
                  >
                    <Text className="text-muted text-lg">✕</Text>
                  </Pressable>
                ) : (
                  <Text className="text-muted text-base">›</Text>
                )}
              </Pressable>

              {description && !hasError && (
                <TextField.Description>{description}</TextField.Description>
              )}
              {fieldError && (
                <TextField.ErrorMessage>
                  {fieldError.message as string}
                </TextField.ErrorMessage>
              )}
              {showValidationError && !fieldError && (
                <TextField.ErrorMessage>
                  Veuillez sélectionner une ville dans la liste
                </TextField.ErrorMessage>
              )}
            </TextField>

            {/* Location error */}
            {nearbyError && isFetchingLocation && (
              <View className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <Text className="text-sm text-destructive">
                  {nearbyError.message}
                </Text>
              </View>
            )}

            {/* Search modal */}
            <Modal
              visible={isModalOpen}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={closeModal}
            >
              <SafeAreaView className="flex-1 bg-background">
                {/* Modal header */}
                <View className="flex-row items-center gap-3 px-4 pt-4 pb-2">
                  <View className="flex-1 flex-row items-center bg-background-tertiary border border-separator rounded-xl px-3">
                    <Search
                      size={18}
                      className="text-muted mr-4"
                      color="#9ca3af"
                    />
                    <TextInput
                      ref={searchInputRef}
                      autoFocus
                      value={query}
                      onChangeText={handleTextChange}
                      placeholder={placeholder}
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="search"
                      className="flex-1 py-3 text-base text-foreground pl-2"
                      style={{ color: "inherit" }}
                    />
                    {isLoading ? (
                      <Spinner size="sm" color="#9ca3af" />
                    ) : query.length > 0 ? (
                      <Pressable
                        onPress={() => handleTextChange("")}
                        hitSlop={8}
                      >
                        <X size={18} color="#9ca3af" />
                      </Pressable>
                    ) : null}
                  </View>

                  <Button onPress={closeModal} variant="primary" size="sm">
                    Annuler
                  </Button>
                </View>

                {/* Results */}
                {cities.length > 0 ? (
                  <FlatList
                    data={cities}
                    keyExtractor={(item) => item.place_id}
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => <Divider />}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => handleCitySelect(item, onChange)}
                        className="py-3 px-4 bg-background-tertiary active:opacity-70"
                      >
                        <Text className="text-base text-foreground font-medium">
                          {item.formatted_address}
                        </Text>
                      </Pressable>
                    )}
                  />
                ) : query.trim() && !isLoading ? (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-muted text-base">
                      Aucune ville trouvée
                    </Text>
                  </View>
                ) : !query.trim() ? (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-muted text-base">
                      Tapez pour rechercher une ville
                    </Text>
                  </View>
                ) : null}
              </SafeAreaView>
            </Modal>
          </View>
        );
      }}
    />
  );
};
