import { FormField } from "heroui-native";
import { View } from "react-native";

interface SwitchFieldProps {
  isSelected: boolean;
  onSelectedChange: (value: boolean) => void;
  title: string;
  description: string;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  isSelected,
  onSelectedChange,
  title,
  description
}) => {
  return (
    <FormField isSelected={isSelected} onSelectedChange={onSelectedChange}>
      <View className="flex-1">
        <FormField.Label>{title}</FormField.Label>
        <FormField.Description>{description}</FormField.Description>
      </View>
      <FormField.Indicator />
    </FormField>
  );
};
