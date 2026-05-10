import { TextField } from "heroui-native";
import { ReactNode } from "react";
import { View } from "react-native";

type IconTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;

  placeholder?: string;
  error?: string;

  icon?: ReactNode;
  iconPosition?: "left" | "right";

  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";

  maxLength?: number;
};

export function IconTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  maxLength,
  iconPosition = "left",
  keyboardType = "default"
}: IconTextFieldProps) {
  return (
    <TextField isInvalid={!!error}>
      <TextField.Label>{label}</TextField.Label>

      <View className="w-full flex-row items-center">
        <TextField.Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          maxLength={maxLength || 100}
          className={`flex-1 ${
            icon ? (iconPosition === "left" ? "px-10" : "pl-3 pr-10") : "px-3"
          }`}
        />

        {icon && (
          <View
            className={`absolute ${
              iconPosition === "left" ? "left-3.5" : "right-3.5"
            }`}
            pointerEvents="none"
          >
            {icon}
          </View>
        )}
      </View>

      {error && <TextField.ErrorMessage>{error}</TextField.ErrorMessage>}
    </TextField>
  );
}
