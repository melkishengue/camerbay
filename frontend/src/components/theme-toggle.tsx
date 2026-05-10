import { Ionicons } from "@expo/vector-icons";

import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { cn, useThemeColor } from "heroui-native";
import { type FC } from "react";
import { Platform, Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { withUniwind } from "uniwind";
import { useAppTheme } from "../contexts/app-theme-context";

const StyledIonicons = withUniwind(Ionicons);

export const ThemeToggle: FC = () => {
  const { toggleTheme, isLight } = useAppTheme();
  const [themeColorAccentForeground] = useThemeColor(["accent-foreground"]);

  const isLGAvailable = isLiquidGlassAvailable();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleTheme();
      }}
      className={cn(
        "p-3 bg-accent rounded-full",
        isLGAvailable && "px-2.5 py-2"
      )}
    >
      {isLight ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <StyledIonicons
            name="moon"
            size={20}
            color={themeColorAccentForeground}
          />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <StyledIonicons
            name="sunny"
            size={20}
            color={themeColorAccentForeground}
          />
        </Animated.View>
      )}
    </Pressable>
  );
};
