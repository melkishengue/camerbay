/* eslint-disable react-hooks/rules-of-hooks */
import * as Location from "expo-location";
import { Button, Divider, Spinner, TextField } from "heroui-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import {
  Alert,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
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
  placeholder = "Search for a city...",
  countryCode = "DE",
  radiusKm = 2,
  className = "",
  description,
  isRequired = false,
  rules
}) => {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const isSelectingCity = useRef(false);
  const lastSyncedValue = useRef<string | null>(null);

  const {
    searchByName,
    cities,
    isLoading,
    error: searchError,
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

  const handleTextChange = useCallback(
    (text: string) => {
      // Don't trigger search if we're programmatically setting the value
      if (isSelectingCity.current) {
        return;
      }

      setQuery(text);
      setShowValidationError(false);

      if (text.trim()) {
        searchByName(text);
        if (!isDropdownOpen) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsDropdownOpen(true);
        }
      } else {
        clearSearch();
        if (isDropdownOpen) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsDropdownOpen(false);
        }
      }
    },
    [searchByName, clearSearch, isDropdownOpen]
  );

  const handleCitySelect = useCallback(
    (city: Place, onChange: (value: Place) => void) => {
      isSelectingCity.current = true;
      setQuery(city.name);
      lastSyncedValue.current = city.name;
      setShowValidationError(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsDropdownOpen(false);
      Keyboard.dismiss();
      onChange(city);
      clearSearch();
      // Reset the flag after a short delay
      setTimeout(() => {
        isSelectingCity.current = false;
      }, 100);
    },
    [clearSearch]
  );

  const handleBlur = useCallback(
    (value: Place | null) => {
      // Close dropdown with animation
      if (isDropdownOpen) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsDropdownOpen(false);
      }

      // Only show validation error if there's query text but no selected city
      // (user typed something but didn't select from dropdown)
      // If the field is empty and not required, that's fine
      if (query.trim() && !value) {
        setShowValidationError(true);
      }
    },
    [isDropdownOpen, query]
  );

  const handleFocus = () => {
    setShowValidationError(false);
    if (query.trim() && cities.length > 0 && !isDropdownOpen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsDropdownOpen(true);
    }
  };

  const handleClearInput = (onChange: (value: Place | null) => void) => {
    setQuery("");
    lastSyncedValue.current = null;
    setShowValidationError(false);
    clearSearch();
    onChange(null);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(false);
  };

  const handleUseCurrentLocation = async (onChange: (value: Place) => void) => {
    try {
      setIsFetchingLocation(true);

      // Check permission status
      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();

      let finalStatus = existingStatus;

      // Request permission if not granted
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

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      // Search for nearby cities
      await searchByLocation(
        location.coords.latitude,
        location.coords.longitude
      );

      setIsFetchingLocation(false);
    } catch (error) {
      setIsFetchingLocation(false);
      Alert.alert(
        "Erreur",
        "Impossible d'obtenir votre localisation. Veuillez réessayer."
      );
    }
  };

  const fieldError = errors?.[name];
  const hasError = !!fieldError || showValidationError;

  // Build validation rules based on isRequired prop
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

        // Sync query with selected value (handles both initial value and external changes)
        useEffect(() => {
          if (value?.name) {
            // Only update if the value is different from what we last synced
            if (lastSyncedValue.current !== value.name) {
              isSelectingCity.current = true;
              setQuery(value.name);
              lastSyncedValue.current = value.name;
              setShowValidationError(false);
              setTimeout(() => {
                isSelectingCity.current = false;
              }, 100);
            }
          } else if (!value) {
            // Clear query if value is null/undefined
            if (lastSyncedValue.current !== null) {
              setQuery("");
              lastSyncedValue.current = null;
            }
          }
        }, [value]);

        return (
          <View className={className}>
            <TextField isRequired={isRequired} isInvalid={hasError}>
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

              <View className="relative">
                <View className="w-full flex-row items-center">
                  <TextField.Input
                    placeholder={placeholder}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={query}
                    onChangeText={handleTextChange}
                    onFocus={handleFocus}
                    onBlur={() => handleBlur(value)}
                    className="flex-1 pr-10"
                    editable={!isFetchingLocation}
                  />

                  {/* Loading indicator */}
                  {(isLoading || isFetchingLocation) && (
                    <View className="absolute right-3" pointerEvents="none">
                      <Spinner size="sm" color="#9ca3af" />
                    </View>
                  )}

                  {/* Clear button */}
                  {query && !isLoading && !isFetchingLocation && (
                    <Pressable
                      className="absolute right-3"
                      onPress={() => handleClearInput(onChange)}
                    >
                      <Text className="text-muted text-lg">✕</Text>
                    </Pressable>
                  )}
                </View>

                {/* Dropdown Results */}
                {isDropdownOpen && cities.length > 0 && (
                  <View className="absolute top-full left-0 right-0 mt-2 bg-overlay border border-separator rounded-xl overflow-hidden shadow-lg z-50">
                    <ScrollView
                      className="max-h-64"
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {cities.map((place, index) => (
                        <React.Fragment key={place.place_id}>
                          <Pressable
                            onPress={() => handleCitySelect(place, onChange)}
                            className="py-3 px-4 bg-background-tertiary"
                          >
                            <Text className="text-base text-foreground font-medium">
                              {place.formatted_address}
                            </Text>
                            {/* {city.distance_km ? (
                              <Text className="text-sm text-muted mt-0.5">
                                {city.distance_km.toFixed(1)} km
                              </Text>
                            ) : null} */}
                          </Pressable>
                          {index < cities.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Empty state */}
                {isDropdownOpen &&
                  !isLoading &&
                  query.trim() &&
                  cities.length === 0 && (
                    <View className="absolute top-full left-0 right-0 mt-2 bg-overlay border border-separator rounded-xl p-4 z-50">
                      <Text className="text-sm text-muted text-center">
                        Aucune ville trouvée
                      </Text>
                    </View>
                  )}
              </View>

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
          </View>
        );
      }}
    />
  );
};
