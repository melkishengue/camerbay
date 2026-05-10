import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeColor } from "heroui-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const StyleAnimatedView = withUniwind(Animated.View);

export const FloatingTriggerButton = () => {
  const insets = useSafeAreaInsets();
  const themeColorAccentForeground = useThemeColor("accent-foreground");

  return (
    <StyleAnimatedView
      className="absolute right-6 size-14 items-center justify-center rounded-full bg-accent"
      style={[{ bottom: insets.bottom }]}
    >
      <FontAwesome6 name="plus" size={20} color={themeColorAccentForeground} />
    </StyleAnimatedView>
  );
};
