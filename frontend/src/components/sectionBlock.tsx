import { useThemeColor } from "heroui-native";
import React from "react";
import { Text, View } from "react-native";

interface SectionLabelProps {
  children: string;
  icon?: React.ReactNode;
}

export function SectionLabel({ children, icon }: SectionLabelProps) {
  const [accentColor] = useThemeColor(["accent"]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginBottom: 10,
        marginTop: 4
      }}
    >
      {icon && (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: accentColor + "18",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {icon}
        </View>
      )}
      <Text
        className="text-muted"
        style={{
          fontSize: 10.5,
          fontFamily: "Inter_700Bold",
          letterSpacing: 1.1,
          textTransform: "uppercase"
        }}
      >
        {children}
      </Text>
    </View>
  );
}

interface SectionBlockProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  padding?: number;
  className?: string;
}

export function SectionBlock({
  title,
  icon,
  children,
  padding = 16,
  className
}: SectionBlockProps) {
  return (
    <View
      className={`bg-surface border border-border rounded-2xl${className ? ` ${className}` : ""}`}
      style={{ padding }}
    >
      <SectionLabel icon={icon}>{title}</SectionLabel>
      {children}
    </View>
  );
}
