import { cn } from "heroui-native";
import { Edit } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface InfoItemProps {
  /** Left icon slot */
  leftIcon?: React.ReactNode;
  /** Label text */
  label?: string;
  /** Value text */
  value?: string;
  /** Right content slot - can be icon, text, or any component */
  rightContent?: React.ReactNode;
  /** Variant styling */
  variant?: "default" | "highlighted";
  /** Make the entire item pressable */
  onPress?: () => void;
  /** Custom className */
  className?: string;
  /** Icon background color for default variant */
  iconBgColor?: string;
  /** Icon color */
  iconColor?: string;
}

export function InfoItem({
  leftIcon,
  label,
  value,
  rightContent,
  variant = "default",
  onPress,
  className,
  iconBgColor = "bg-primary/10",
  iconColor
}: InfoItemProps) {
  const isHighlighted = variant === "highlighted";

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Container
      className={cn(
        "flex-row items-center gap-4 p-4",
        isHighlighted && "bg-warning/10 border-2 border-warning/30 rounded-2xl",
        className
      )}
      {...containerProps}
    >
      {/* Left Icon */}
      {leftIcon && (
        <View
          className={cn(
            "w-11 h-11 rounded-xl items-center justify-center",
            isHighlighted ? "bg-warning" : iconBgColor
          )}
        >
          {leftIcon}
        </View>
      )}

      {/* Label & Value */}
      <View className="flex-1">
        {label && (
          <Text
            className={cn(
              "mb-1 text-foreground font-bold"
              // isHighlighted ? "text-foreground font-medium" : "text-muted"
            )}
          >
            {label}
          </Text>
        )}
        {value && (
          <Text
            className={cn(
              "text-sm text-muted"
              // isHighlighted ? "text-muted" : "text-foreground font-medium"
            )}
          >
            {value}
          </Text>
        )}
      </View>

      {/* Right Content */}
      {rightContent && <View>{rightContent}</View>}
    </Container>
  );
}

// Convenience sub-components for common patterns
InfoItem.Icon = function InfoItemIcon({
  children,
  color
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <>{children}</>;
};

InfoItem.Badge = function InfoItemBadge({
  text,
  className
}: {
  text: string;
  className?: string;
}) {
  return (
    <View className={cn("px-3 py-1.5 rounded-full", className)}>
      <Text className="text-xs font-semibold">{text}</Text>
    </View>
  );
};

InfoItem.EditButton = function InfoItemEditButton({
  onPress
}: {
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-9 h-9 bg-muted/50 rounded-lg items-center justify-center"
      activeOpacity={0.7}
    >
      <Edit size={16} color="#64748b" />
    </TouchableOpacity>
  );
};
