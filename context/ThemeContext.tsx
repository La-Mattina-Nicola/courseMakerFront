import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CustomThemeColors,
  ThemePresetKey,
  themePresets,
} from "../constants/themePresets";

interface ThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  text: string;
  icon: string;
  action: string;
}

interface ThemeContextType {
  selectedTheme: ThemePresetKey;
  colors: ThemeColors;
  setSelectedTheme: (theme: ThemePresetKey) => Promise<void>;
  setCustomColors: (colors: CustomThemeColors) => Promise<void>;
}

const defaultTheme: ThemeColors = {
  primary: "#1a1a1a",
  secondary: "#2a2a2a",
  tertiary: "#3a3a3a",
  text: "#ffffff",
  icon: "#a0a0a0",
  action: "#4a90e2",
};

const ThemeContext = createContext<ThemeContextType>({
  selectedTheme: "dark",
  colors: defaultTheme,
  setSelectedTheme: async () => {},
  setCustomColors: async () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedTheme, setSelectedThemeState] =
    useState<ThemePresetKey>("dark");
  const [colors, setColors] = useState<ThemeColors>(themePresets.dark.colors);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme and custom colors from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("selectedTheme");

        if (savedTheme === "custom") {
          // Load custom theme colors
          const customColorsJson = await AsyncStorage.getItem(
            "customThemeColors"
          );
          if (customColorsJson) {
            const customColors = JSON.parse(
              customColorsJson
            ) as CustomThemeColors;
            setSelectedThemeState("custom");
            setColors(customColors);
          } else {
            // Fallback to default dark theme
            setSelectedThemeState("dark");
            setColors(themePresets.dark.colors);
          }
        } else if (savedTheme && savedTheme in themePresets) {
          const themeId = savedTheme as ThemePresetKey;
          setSelectedThemeState(themeId);
          setColors(themePresets[themeId].colors);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const handleSetSelectedTheme = async (theme: ThemePresetKey) => {
    try {
      setSelectedThemeState(theme);
      setColors(themePresets[theme].colors);
      await AsyncStorage.setItem("selectedTheme", theme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const handleSetCustomColors = async (customColors: CustomThemeColors) => {
    try {
      setSelectedThemeState("custom");
      setColors(customColors);
      await AsyncStorage.setItem("selectedTheme", "custom");
      await AsyncStorage.setItem(
        "customThemeColors",
        JSON.stringify(customColors)
      );
    } catch (error) {
      console.error("Error saving custom colors:", error);
    }
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider
      value={{
        selectedTheme,
        colors,
        setSelectedTheme: handleSetSelectedTheme,
        setCustomColors: handleSetCustomColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
