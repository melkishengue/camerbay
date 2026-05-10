import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useColorScheme } from "react-native";
import { Uniwind, useUniwind } from "uniwind";

type ThemeFamily = "default" | "sky" | "mint" | "lavender" | "alpha";

interface AppThemeContextType {
  currentTheme: string;
  themeFamily: ThemeFamily;
  isLight: boolean;
  isDark: boolean;
  setThemeFamily: (family: ThemeFamily) => void;
  toggleTheme: () => void;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(
  undefined
);

const THEME_STORAGE_KEY = "app_theme_family";

const FAMILIES: ThemeFamily[] = ["sky", "mint", "lavender", "alpha", "default"];

function getThemeName(family: ThemeFamily, isDark: boolean): string {
  if (family === "default") return isDark ? "dark" : "light";
  return `${family}-${isDark ? "dark" : "light"}`;
}

function isValidFamily(value: string): value is ThemeFamily {
  return (FAMILIES as string[]).includes(value);
}

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { theme } = useUniwind();
  const systemColorScheme = useColorScheme();
  const [themeFamily, setThemeFamilyState] = useState<ThemeFamily>("sky");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme family on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedFamily = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (savedFamily && isValidFamily(savedFamily)) {
          setThemeFamilyState(savedFamily);
          return;
        }
        setThemeFamilyState("mint");
      } catch (error) {
      } finally {
        setIsInitialized(true);
      }
    };

    loadThemePreference();
  }, []);

  // Apply theme whenever family or system color scheme changes
  useEffect(() => {
    if (!isInitialized) return;

    const isDark = systemColorScheme === "dark";
    const newTheme = getThemeName(themeFamily, isDark);
    Uniwind.setTheme(newTheme as any);
  }, [systemColorScheme, themeFamily, isInitialized]);

  const isLight = useMemo(() => {
    return theme === "light" || theme.endsWith("-light");
  }, [theme]);

  const isDark = useMemo(() => {
    return theme === "dark" || theme.endsWith("-dark");
  }, [theme]);

  const setThemeFamily = useCallback(async (family: ThemeFamily) => {
    try {
      setThemeFamilyState(family);
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, family);
    } catch (error) {}
  }, []);

  // Cycle through theme families
  const toggleTheme = useCallback(() => {
    const idx = FAMILIES.indexOf(themeFamily);
    const next = FAMILIES[(idx + 1) % FAMILIES.length];
    setThemeFamily(next);
  }, [themeFamily, setThemeFamily]);

  const value = useMemo(
    () => ({
      currentTheme: theme,
      themeFamily,
      isLight,
      isDark,
      setThemeFamily,
      toggleTheme
    }),
    [theme, themeFamily, isLight, isDark, setThemeFamily, toggleTheme]
  );

  // Don't render children until theme is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
};
