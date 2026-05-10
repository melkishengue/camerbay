// components/CategorySelect.tsx
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import { Button, Select } from "heroui-native";
import { ChevronDown } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";

// SelectOption type to match heroui-native Select component
type SelectOption = {
  value: string;
  label: string;
};

interface CategorySelectProps {
  control: Control<any>;
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  requiredMessage?: string;
  errors?: FieldErrors;
  disabled?: boolean;
  defaultValue?: string | null;
  onCategoryChange?: (category: Category | null) => void;
  showAllOption?: boolean;
}

export function CategorySelect({
  control,
  name = "category",
  label = "Catégorie *",
  placeholder = "Sélectionnez une catégorie",
  required = true,
  requiredMessage = "Veuillez sélectionner une catégorie",
  errors,
  disabled = false,
  defaultValue = null,
  onCategoryChange,
  showAllOption = false
}: CategorySelectProps) {
  const { categories, isLoading, fetchCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<
    SelectOption | undefined
  >();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const ALL_OPTION: SelectOption = { value: "__all__", label: "Toutes les catégories" };

  // Convert Category to SelectOption
  const categoryToSelectOption = (category: Category): SelectOption => ({
    value: category.id,
    label: category.title
  });

  const mappedOptions = categories.map(categoryToSelectOption);
  const selectOptions: SelectOption[] = showAllOption ? [ALL_OPTION, ...mappedOptions] : mappedOptions;

  return (
    <View>
      <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>
      <Controller
        control={control}
        name={name}
        defaultValue={defaultValue}
        rules={{
          required: required ? requiredMessage : undefined
        }}
        render={({ field: { onChange, value } }) => {
          // Sync selectedCategory with form value when categories load or value changes
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (value && categories.length > 0) {
              const category = categories.find((c) => c.id === value.id);
              if (category) {
                setSelectedCategory(categoryToSelectOption(category));
              }
            } else if (!value) {
              setSelectedCategory(showAllOption ? ALL_OPTION : undefined);
            }
          }, [value, categories]);

          return (
            <View>
              <Select
                value={selectedCategory}
                onValueChange={(selected) => {
                  if (!selected || selected.value === "__all__") {
                    setSelectedCategory(showAllOption ? ALL_OPTION : undefined);
                    onChange(null);
                    onCategoryChange?.(null);
                    return;
                  }

                  const category = categories.find(
                    (c) => c.id === selected.value
                  );

                  setSelectedCategory(selected);
                  onChange(category || null);
                  onCategoryChange?.(category || null);
                }}
                isDisabled={disabled || isLoading}
              >
                <Select.Trigger asChild>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    isDisabled={disabled || isLoading}
                  >
                    {isLoading ? (
                      <Text className="text-sm text-muted">Chargement...</Text>
                    ) : selectedCategory ? (
                      <Text className="text-sm text-foreground">
                        {selectedCategory.label}
                      </Text>
                    ) : (
                      <Text className="text-sm text-muted">{placeholder}</Text>
                    )}
                    <ChevronDown size={18} color={"white"} />
                  </Button>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content
                    width={340}
                    className="rounded-2xl h-[200px]"
                    placement="bottom"
                  >
                    <ScrollView>
                      {selectOptions.map((option) => (
                        <Select.Item
                          key={option.value}
                          value={option.value}
                          label={option.label}
                        >
                          <View className="flex-1">
                            <Text className="text-base text-foreground">
                              {option.label}
                            </Text>
                          </View>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </ScrollView>
                  </Select.Content>
                </Select.Portal>
              </Select>
              {errors?.[name] && (
                <Text className="text-destructive text-xs mt-2">
                  {errors[name]?.message as string}
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
