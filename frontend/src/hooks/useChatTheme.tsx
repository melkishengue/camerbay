import { useAppTheme } from "@/contexts/app-theme-context";
import { useThemeColor } from "heroui-native";
import { useMemo } from "react";
import type { DeepPartial, Theme } from "stream-chat-expo";

export const useStreamChatTheme = () => {
  const { isDark } = useAppTheme();

  const [
    background,
    foreground,
    surface,
    defaultColor,
    muted,
    accent,
    danger,
    success,
    divider,
    overlay
  ] = useThemeColor([
    "background",
    "foreground",
    "surface",
    "default",
    "muted",
    "accent",
    "danger",
    "success",
    "divider",
    "overlay"
  ]);

  const chatStyle = useMemo<DeepPartial<Theme>>(
    () => ({
      avatar: {
        image: {
          height: 32,
          width: 32
        }
      },
      colors: isDark
        ? {
            accent_blue: accent,
            accent_green: success,
            accent_red: danger,

            bg_gradient_end: background,
            bg_gradient_start: surface,
            black: foreground,
            white: background,
            white_smoke: surface,
            white_snow: background,

            grey: muted,
            grey_dark: foreground,
            grey_gainsboro: defaultColor,
            grey_whisper: surface,
            light_gray: surface,

            border: divider,

            blue_alice: surface,
            light_blue: accent,
            icon_background: foreground,

            modal_shadow: "#000000CC",
            overlay: overlay,
            shadow_icon: "#00000060",

            targetedMessageBackground: defaultColor,
            transparent: "transparent"
          }
        : {
            accent_blue: accent,
            accent_green: success,
            accent_red: danger,

            bg_gradient_end: background,
            bg_gradient_start: defaultColor,
            black: foreground,
            white: background,
            white_smoke: defaultColor,
            white_snow: surface,

            grey: muted,
            grey_dark: foreground,
            grey_gainsboro: divider,
            grey_whisper: defaultColor,
            light_gray: defaultColor,

            border: divider,

            blue_alice: surface,
            light_blue: accent,
            icon_background: background,

            modal_shadow: "#0000001A",
            overlay: "#00000066",
            shadow_icon: "#00000026",

            targetedMessageBackground: surface,
            transparent: "transparent"
          },
      spinner: {
        height: 15,
        width: 15
      },
      messageSimple: {
        content: {
          container: {
            borderRadius: 12
          },
          containerInner: {
            borderRadius: 12
          }
        }
      },
      messageInput: {
        container: {
          borderWidth: 1
        }
      }
    }),
    [
      isDark,
      background,
      foreground,
      surface,
      defaultColor,
      muted,
      accent,
      danger,
      success,
      divider,
      overlay
    ]
  );

  return chatStyle;
};
