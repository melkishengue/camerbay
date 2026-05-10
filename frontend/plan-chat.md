# Plan: Make Chat Feature Adapt to App Theme

## Problem

The chat (Stream Chat) is stuck in light mode regardless of the app's active theme (e.g. `sky-dark`).

### Root Cause

In `src/hooks/useChatTheme.tsx`, the theme hook uses **React Native's `useColorScheme()`** to decide between light and dark colors:

```ts
const colorScheme = useColorScheme(); // ← reads OS-level dark/light mode
```

This only reflects the **device system setting** (iOS/Android dark mode toggle), not the app's internal theme managed by `AppThemeContext` / Uniwind. When the user selects `sky-dark` in the app but the device is in light mode, `useColorScheme()` returns `"light"` and the chat renders with light colors.

Additionally, the hardcoded color values in the theme are generic HeroUI defaults (e.g. `#0072F5`, `#000000`, `#FFFFFF`) and don't match the active theme's actual palette (sky-dark uses deep twilight blues like `oklch(0.15 0.042 240)`).

## Proposed Solution

### 1. Replace `useColorScheme()` with `useAppTheme()` in `useChatTheme.tsx`

Use the app's own theme context instead of the OS color scheme:

```ts
// Before
const colorScheme = useColorScheme();
// colorScheme === "dark" ? darkColors : lightColors

// After
import { useAppTheme } from "@/contexts/app-theme-context";
const { isDark } = useAppTheme();
// isDark ? darkColors : lightColors
```

This ensures the chat respects the app's theme selection (sky-dark, mint-light, etc.) instead of the OS setting.

### 2. Use resolved HeroUI theme colors instead of hardcoded hex values

Replace the hardcoded color palette with colors pulled from the active HeroUI theme using `useThemeColor()`:

```ts
import { useThemeColor } from "heroui-native";

const [background, foreground, surface, muted, accent, danger, success, border, overlay, defaultColor] =
  useThemeColor([
    "background", "foreground", "surface", "muted", "accent",
    "danger", "success", "border", "overlay", "default"
  ]);
```

Then map these to Stream Chat's color slots:

| Stream Chat color     | Maps to                     |
|-----------------------|-----------------------------|
| `white` / `bg_*`      | `background`               |
| `black` / `grey_dark` | `foreground`               |
| `white_smoke`         | `surface`                  |
| `white_snow`          | `default`                  |
| `grey`                | `muted`                    |
| `grey_gainsboro`      | `default` (light) / `surface` (dark) |
| `grey_whisper`        | `surface`                  |
| `border`              | `border` (with fallback)   |
| `accent_blue`         | `accent`                   |
| `accent_red`          | `danger`                   |
| `accent_green`        | `success`                  |
| `overlay`             | `overlay`                  |

### 3. Update the `useEffect` dependency

Currently the effect watches `colorScheme`. It should watch the app theme instead:

```ts
// Before
useEffect(() => {
  setChatStyle(getChatStyle());
}, [colorScheme]);

// After — useAppTheme's isDark + useThemeColor values will trigger re-renders
// automatically via hooks, so the useEffect can be simplified or removed
```

Since `useThemeColor` and `useAppTheme` are reactive hooks, `getChatStyle()` can compute directly from their return values without needing a separate `useEffect` + `useState`. A `useMemo` keyed on `isDark` and the resolved colors is cleaner.

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useChatTheme.tsx` | Replace `useColorScheme()` with `useAppTheme()`, replace hardcoded colors with `useThemeColor()`, switch from `useState`+`useEffect` to `useMemo` |

No other files need changes. The `useChat.tsx` already consumes `useStreamChatTheme()` and passes the result to `OverlayProvider`'s `style` prop, so it will automatically pick up the new theme-aware colors.

## Risks & Considerations

- **oklch → hex**: `useThemeColor()` from heroui-native returns resolved color strings at runtime. Stream Chat expects standard CSS color values. Need to verify the resolved format is compatible (likely hex/rgb — should be fine since RN resolves oklch at the native level).
- **Border fallback**: The sky themes define `--border: oklch(0 0 0 / 0%)` (transparent). Stream Chat may look odd without visible borders. Consider using `divider` or `default` color as a fallback for the chat border slot.
- **Performance**: `useMemo` with theme color dependencies is more efficient than the current `useState` + `useEffect` pattern.
