// Présets de thèmes avec différentes palettes de couleurs
export const themePresets = {
  dark: {
    name: "Sombre (Défaut)",
    id: "dark",
    colors: {
      primary: "#1a1a1a",
      secondary: "#2a2a2a",
      tertiary: "#404040",
      text: "#f5f5f5",
      icon: "#b0b0b0",
      action: "#4a9eff",
    },
  },
  light: {
    name: "Clair",
    id: "light",
    colors: {
      primary: "#f5f5f5",
      secondary: "#e8e8e8",
      tertiary: "#d8d8d8",
      text: "#1a1a1a",
      icon: "#505050",
      action: "#0066cc",
    },
  },
  ocean: {
    name: "Océan",
    id: "ocean",
    colors: {
      primary: "#0a1428",
      secondary: "#163b5f",
      tertiary: "#2a5fa3",
      text: "#e8f4f8",
      icon: "#a0c8e8",
      action: "#00d4ff",
    },
  },
  forest: {
    name: "Forêt",
    id: "forest",
    colors: {
      primary: "#0d2818",
      secondary: "#1a4d2e",
      tertiary: "#2d6a4f",
      text: "#d5f4e6",
      icon: "#a8d5ba",
      action: "#52b788",
    },
  },
  sunset: {
    name: "Coucher de soleil",
    id: "sunset",
    colors: {
      primary: "#2a1a0f",
      secondary: "#5a3a1a",
      tertiary: "#8a5a2a",
      text: "#fce8d3",
      icon: "#d4a574",
      action: "#ff8c42",
    },
  },
  purple: {
    name: "Violet",
    id: "purple",
    colors: {
      primary: "#1a0f2e",
      secondary: "#3d1a5c",
      tertiary: "#5d2e8a",
      text: "#e8d5f2",
      icon: "#c4a8d8",
      action: "#a855f7",
    },
  },
  crimson: {
    name: "Cramoisi",
    id: "crimson",
    colors: {
      primary: "#2a0f1a",
      secondary: "#5a1a2a",
      tertiary: "#8a2a3a",
      text: "#f5d8dc",
      icon: "#d4a0a8",
      action: "#e63946",
    },
  },
  custom: {
    name: "Personnalisé",
    id: "custom",
    colors: {
      primary: "#1a1a1a",
      secondary: "#2a2a2a",
      tertiary: "#404040",
      text: "#f5f5f5",
      icon: "#b0b0b0",
      action: "#4a9eff",
    },
  },
};

export type ThemePresetKey = keyof typeof themePresets;
export type ThemePreset = (typeof themePresets)[ThemePresetKey];

// Type pour les couleurs personnalisées
export interface CustomThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  text: string;
  icon: string;
  action: string;
}

