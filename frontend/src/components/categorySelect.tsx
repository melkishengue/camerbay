import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/category";
import { Button, Select } from "heroui-native";
import { ChevronDown } from "lucide-react-native";
import React, { useEffect } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";

const ALL_OPTION = { value: "__all__", label: "Toutes les catégories" };

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const options = [
    ...(showAllOption ? [ALL_OPTION] : []),
    ...categories.map((c) => ({ value: c.id, label: c.title }))
  ];

  return (
    <View>
      <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>
      <Controller
        control={control}
        name={name}
        defaultValue={defaultValue}
        rules={{ required: required ? requiredMessage : undefined }}
        render={({ field: { onChange, value } }) => {
          const selectedOption = value
            ? { value: value.id, label: value.title }
            : showAllOption
              ? ALL_OPTION
              : undefined;

          return (
            <View>
              <Select
                value={selectedOption}
                onValueChange={(selected) => {
                  if (!selected || selected.value === "__all__") {
                    onChange(null);
                    onCategoryChange?.(null);
                    return;
                  }
                  const category =
                    categories.find((c) => c.id === selected.value) ?? null;
                  onChange(category);
                  onCategoryChange?.(category);
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
                    ) : selectedOption ? (
                      <Text className="text-sm text-foreground">
                        {selectedOption.label}
                      </Text>
                    ) : (
                      <Text className="text-sm text-muted">{placeholder}</Text>
                    )}
                    <ChevronDown size={18} color="white" />
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
                      {options.map((option) => (
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
