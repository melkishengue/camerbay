import { Divider, TextField } from "heroui-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Control, Controller, FieldErrors, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View
} from "react-native";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface AutocompleteOption {
  id: string;
  label: string;
  [key: string]: any;
}

interface AutocompleteProps<T extends AutocompleteOption> {
  // React Hook Form props
  control: Control<any>;
  name: string;
  errors?: FieldErrors<any>;
  rules?: any;

  // Field configuration
  label: string;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  className?: string;

  // Search functionality
  onSearch: (query: string) => void;
  options: T[];
  isLoading: boolean;
  searchError?: Error | null;

  // Rendering
  renderOption: (option: T) => React.ReactNode;
  renderSelectedValue?: (value: T) => React.ReactNode;
  getOptionLabel: (option: T) => string;

  // Optional empty state
  emptyStateText?: string;
  validationErrorText?: string;

  // Clear functionality
  onClear?: () => void;
}

export function Autocomplete<T extends AutocompleteOption>({
  control,
  name,
  errors,
  rules,
  label,
  placeholder = "Search...",
  description,
  isRequired = false,
  className = "",
  onSearch,
  options,
  isLoading,
  searchError,
  renderOption,
  renderSelectedValue,
  getOptionLabel,
  emptyStateText = "No results found",
  validationErrorText = "Please select an option from the list",
  onClear
}: AutocompleteProps<T>) {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const isSelectingOption = useRef(false);

  const handleTextChange = useCallback(
    (text: string) => {
      // Don't trigger search if we're programmatically setting the value
      if (isSelectingOption.current) {
        return;
      }

      setQuery(text);
      setShowValidationError(false);

      if (text.trim()) {
        onSearch(text);
        if (!isDropdownOpen) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsDropdownOpen(true);
        }
      } else {
        onClear?.();
        if (isDropdownOpen) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsDropdownOpen(false);
        }
      }
    },
    [onSearch, onClear, isDropdownOpen]
  );

  const handleOptionSelect = useCallback(
    (option: T, onChange: (value: T) => void) => {
      isSelectingOption.current = true;
      setQuery(getOptionLabel(option));
      setShowValidationError(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsDropdownOpen(false);
      Keyboard.dismiss();
      onChange(option);
      onClear?.();
      // Reset the flag after a short delay
      setTimeout(() => {
        isSelectingOption.current = false;
      }, 100);
    },
    [getOptionLabel, onClear]
  );

  const handleBlur = useCallback(
    (value: T | null) => {
      // Close dropdown with animation
      if (isDropdownOpen) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsDropdownOpen(false);
      }

      // Show validation error if there's query text but no selected option
      if (query.trim() && !value) {
        setShowValidationError(true);
      }
    },
    [isDropdownOpen, query]
  );

  const handleFocus = () => {
    setShowValidationError(false);
    if (query.trim() && options.length > 0 && !isDropdownOpen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsDropdownOpen(true);
    }
  };

  const handleClearInput = (onChange: (value: T | null) => void) => {
    setQuery("");
    setShowValidationError(false);
    onClear?.();
    onChange(null);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(false);
  };

  const fieldError = errors?.[name];
  const hasError = !!fieldError || showValidationError;

  // Watch the field value at the component level to sync query
  const watchedValue = useWatch({ control, name });

  useEffect(() => {
    if (watchedValue && getOptionLabel(watchedValue) !== query) {
      isSelectingOption.current = true;
      setQuery(getOptionLabel(watchedValue));
      setShowValidationError(false);
      setTimeout(() => {
        isSelectingOption.current = false;
      }, 100);
    } else if (!watchedValue && query) {
      setQuery("");
    }
  }, [watchedValue]);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value } }) => {
        return (
          <View className={className}>
            <TextField isRequired={isRequired} isInvalid={hasError}>
              <TextField.Label>{label}</TextField.Label>

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
                  />

                  {/* Loading indicator */}
                  {isLoading && (
                    <View className="absolute right-3" pointerEvents="none">
                      <ActivityIndicator size="small" color="#9ca3af" />
                    </View>
                  )}

                  {/* Clear button */}
                  {query && !isLoading && (
                    <Pressable
                      className="absolute right-3"
                      onPress={() => handleClearInput(onChange)}
                    >
                      <Text className="text-muted text-lg">✕</Text>
                    </Pressable>
                  )}
                </View>

                {/* Dropdown Results */}
                {isDropdownOpen && options.length > 0 && (
                  <View className="absolute top-full left-0 right-0 mt-2 bg-overlay border border-separator rounded-xl overflow-hidden shadow-lg z-50">
                    <ScrollView
                      className="max-h-64"
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {options.map((option, index) => (
                        <React.Fragment key={option.id}>
                          <Pressable
                            onPress={() => handleOptionSelect(option, onChange)}
                            className="bg-background-tertiary"
                          >
                            {renderOption(option)}
                          </Pressable>
                          {index < options.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Empty state */}
                {isDropdownOpen &&
                  !isLoading &&
                  query.trim() &&
                  options.length === 0 && (
                    <View className="absolute top-full left-0 right-0 mt-2 bg-overlay border border-separator rounded-xl p-4 z-50">
                      <Text className="text-sm text-muted text-center">
                        {emptyStateText}
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
                  {validationErrorText}
                </TextField.ErrorMessage>
              )}
            </TextField>

            {/* Render selected value */}
            {value && renderSelectedValue && (
              <View className="mt-4">{renderSelectedValue(value)}</View>
            )}
          </View>
        );
      }}
    />
  );
}
