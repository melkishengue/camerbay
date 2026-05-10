import { useThemeColor } from "heroui-native";
import React, { useState } from "react";
import { Text, View } from "react-native";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export const ExpandableText = ({
  text,
  maxLength = 350,
  className = "text-foreground leading-6"
}: ExpandableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const primaryColor = useThemeColor("accent");
  const needsTruncation = text.length > maxLength;

  return (
    <View>
      <Text className={className}>
        {expanded || !needsTruncation
          ? text
          : `${text.slice(0, maxLength)}... `}
        {needsTruncation && (
          <Text
            style={{ color: primaryColor }}
            onPress={() => setExpanded(!expanded)}
          >
            {expanded ? " Voir moins" : "Voir plus"}
          </Text>
        )}
      </Text>
    </View>
  );
};
