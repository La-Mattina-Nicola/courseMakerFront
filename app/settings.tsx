import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CustomThemeColors,
  ThemePresetKey,
  themePresets,
} from "../constants/themePresets";
import { useTheme } from "../context/ThemeContext";

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  type: "toggle" | "action" | "header";
  icon?: string;
  action?: () => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { selectedTheme, colors, setSelectedTheme, setCustomColors } =
    useTheme();
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customColors, setCustomColorsLocal] = useState<CustomThemeColors>(
    () => {
      // Try to get current custom colors from themePresets or use defaults
      if (selectedTheme === "custom") {
        return colors as CustomThemeColors;
      }
      return themePresets.custom.colors as CustomThemeColors;
    }
  );
  const [activeColorField, setActiveColorField] = useState<
    keyof CustomThemeColors | null
  >(null);

  // Update customColors when modal opens or when theme changes
  useEffect(() => {
    if (showCustomColorPicker) {
      // When modal opens, load the current custom colors
      if (selectedTheme === "custom") {
        setCustomColorsLocal(colors as CustomThemeColors);
      }
    }
  }, [showCustomColorPicker, selectedTheme, colors]);

  // Palette de couleurs organisée par colonne (9 par colonne)
  // Clairs à gauche, foncés à droite
  const commonColors = [
    // Colonne 1: Blancs et gris clairs
    "#FFFFFF",
    "#F5F5F5",
    "#E8E8E8",
    "#D0D0D0",
    "#B0B0B0",
    "#808080",
    "#505050",
    "#2a2a2a",
    "#1a1a1a",
    // Colonne 2: Rouges (clair à foncé)
    "#FFB3B3",
    "#FF9999",
    "#FF7F7F",
    "#FF6666",
    "#FF4444",
    "#E63946",
    "#D32F2F",
    "#C62828",
    "#8B0000",
    // Colonne 3: Oranges (clair à foncé)
    "#FFCCB3",
    "#FFBB99",
    "#FFAA77",
    "#FF9955",
    "#FF8833",
    "#FF8C42",
    "#FF7F00",
    "#F97316",
    "#BF360C",
    // Colonne 4: Jaunes (clair à foncé)
    "#FFFF99",
    "#FFFF66",
    "#FFFF33",
    "#FFFF00",
    "#FFEE00",
    "#FFDD00",
    "#FFCC00",
    "#FFB300",
    "#FFA500",
    // Colonne 5: Verts (clair à foncé)
    "#D5F4E6",
    "#A8D5BA",
    "#7EC8A3",
    "#52B788",
    "#40916C",
    "#2D6A4F",
    "#1B4332",
    "#0D2818",
    "#052E1F",
    // Colonne 6: Cyans (clair à foncé)
    "#B3F0FF",
    "#80E8FF",
    "#4DDFFF",
    "#1FD9FF",
    "#00D4FF",
    "#00BFFF",
    "#00A8E8",
    "#0077B6",
    "#03045E",
    // Colonne 7: Bleus (clair à foncé)
    "#87CEEB",
    "#4A9EFF",
    "#2E96FF",
    "#0080FF",
    "#0066CC",
    "#0052A3",
    "#003D82",
    "#001F3F",
    "#000080",
    // Colonne 8: Violets (clair à foncé)
    "#E8D5F2",
    "#D4B5E8",
    "#C4A8D8",
    "#A855F7",
    "#8B5CF6",
    "#7C3AED",
    "#6D28D9",
    "#5B21B6",
    "#3D0754",
  ];

  const colorFields: (keyof CustomThemeColors)[] = [
    "primary",
    "secondary",
    "tertiary",
    "text",
    "icon",
    "action",
  ];
  const colorLabels: Record<keyof CustomThemeColors, string> = {
    primary: "Primaire",
    secondary: "Secondaire",
    tertiary: "Tertiaire",
    text: "Texte",
    icon: "Icône",
    action: "Action",
  };

  const handleCustomColorChange = (
    field: keyof CustomThemeColors,
    value: string
  ) => {
    setCustomColorsLocal((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveCustomTheme = async () => {
    await setCustomColors(customColors);
    setShowCustomColorPicker(false);
  };

  const settings: SettingItem[] = [
    {
      id: "about",
      title: "À propos",
      type: "header",
    },
    {
      id: "app-version",
      title: "Version de l'Application",
      description: "1.0.0",
      type: "action",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.tertiary }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Paramètres
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Theme Section */}
        <View
          style={[styles.sectionHeader, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.action }]}>
            Thème de Couleurs
          </Text>
        </View>
        <View style={styles.themeListContainer}>
          {["dark", "light", "custom"].map((themeId) => {
            const theme = themePresets[themeId as ThemePresetKey];
            if (!theme) return null;

            // For custom theme, use current colors if selected, otherwise use customColors state
            const displayColors =
              themeId === "custom" && selectedTheme === "custom"
                ? colors
                : themeId === "custom"
                ? customColors
                : theme.colors;

            return (
              <TouchableOpacity
                key={themeId}
                style={[
                  styles.themeListItem,
                  {
                    backgroundColor: colors.secondary,
                    borderColor:
                      selectedTheme === themeId
                        ? colors.action
                        : colors.tertiary,
                    borderWidth: selectedTheme === themeId ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  if (themeId === "custom") {
                    setShowCustomColorPicker(true);
                  } else {
                    setSelectedTheme(themeId as ThemePresetKey);
                  }
                }}
                activeOpacity={0.7}
              >
                {/* Left side: Theme Name and Checkmark */}
                <View style={styles.themeListLeft}>
                  <Text style={[styles.themeName, { color: colors.text }]}>
                    {theme.name}
                  </Text>
                  {selectedTheme === themeId && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.action}
                    />
                  )}
                </View>

                {/* Right side: Color Swatches */}
                <View style={styles.themeColorsRow}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: displayColors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: displayColors.secondary },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: displayColors.tertiary },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: displayColors.text },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: displayColors.icon },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: displayColors.action },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Settings Items */}
        {settings.map((setting, index) => {
          if (setting.type === "header") {
            return (
              <View
                key={setting.id}
                style={[
                  styles.sectionHeader,
                  { backgroundColor: colors.primary },
                  index === 0 && { marginTop: 0 },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.action }]}>
                  {setting.title}
                </Text>
              </View>
            );
          }

          if (setting.type === "action") {
            return (
              <TouchableOpacity
                key={setting.id}
                style={[
                  styles.settingItem,
                  {
                    backgroundColor: colors.secondary,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.tertiary,
                  },
                ]}
                onPress={setting.action}
                activeOpacity={0.7}
              >
                <View style={styles.settingContent}>
                  {setting.icon && (
                    <Ionicons
                      name={setting.icon as any}
                      size={20}
                      color={colors.action}
                      style={styles.settingIcon}
                    />
                  )}
                  <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      {setting.title}
                    </Text>
                    {setting.description && (
                      <Text
                        style={[
                          styles.settingDescription,
                          { color: colors.icon },
                        ]}
                      >
                        {setting.description}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            );
          }

          return null;
        })}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Custom Color Picker Modal */}
      <Modal
        visible={showCustomColorPicker}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.primary }]}
        >
          {/* Modal Header */}
          <View style={[styles.header, { borderBottomColor: colors.tertiary }]}>
            <TouchableOpacity onPress={() => setShowCustomColorPicker(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Thème Personnalisé
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.pickerContent}>
            <Text style={[styles.pickerDescription, { color: colors.text }]}>
              Choisissez vos propres couleurs pour personnaliser l'apparence de
              l'application
            </Text>

            {/* Color Selection Cards */}
            <View style={styles.colorInputsContainer}>
              {colorFields.map((field) => (
                <TouchableOpacity
                  key={field}
                  onPress={() =>
                    setActiveColorField(
                      activeColorField === field ? null : field
                    )
                  }
                  style={[
                    styles.colorCard,
                    {
                      backgroundColor: colors.secondary,
                      borderColor:
                        activeColorField === field
                          ? colors.action
                          : colors.tertiary,
                      borderWidth: activeColorField === field ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.colorCardHeader}>
                    <Text
                      style={[styles.colorLabelText, { color: colors.text }]}
                    >
                      {colorLabels[field]}
                    </Text>
                    <View
                      style={[
                        styles.colorPreview,
                        { backgroundColor: customColors[field] },
                      ]}
                    />
                  </View>

                  {/* Hex input field */}
                  <TextInput
                    style={[
                      styles.colorInput,
                      {
                        backgroundColor: colors.primary,
                        color: colors.text,
                        borderColor: colors.tertiary,
                      },
                    ]}
                    placeholder="#000000"
                    placeholderTextColor={colors.icon}
                    value={customColors[field]}
                    onChangeText={(value) =>
                      handleCustomColorChange(field, value)
                    }
                  />

                  {/* Color Palette - show only when field is active */}
                  {activeColorField === field && (
                    <View style={styles.colorPalette}>
                      {commonColors.map((color, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color,
                              borderColor:
                                customColors[field].toUpperCase() ===
                                color.toUpperCase()
                                  ? colors.text
                                  : "transparent",
                              borderWidth:
                                customColors[field].toUpperCase() ===
                                color.toUpperCase()
                                  ? 3
                                  : 0,
                            },
                          ]}
                          onPress={() => handleCustomColorChange(field, color)}
                          activeOpacity={0.8}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview Section */}
            <View style={styles.pickerPreviewSection}>
              <Text style={[styles.previewTitle, { color: colors.action }]}>
                Aperçu
              </Text>
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: customColors.secondary,
                  },
                ]}
              >
                <View style={styles.previewHeader}>
                  <View
                    style={[
                      styles.previewAvatar,
                      {
                        backgroundColor: customColors.primary,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.previewText,
                        {
                          color: customColors.text,
                        },
                      ]}
                    >
                      Titre Principal
                    </Text>
                    <Text
                      style={[
                        styles.previewSmallText,
                        {
                          color: customColors.icon,
                        },
                      ]}
                    >
                      Texte secondaire
                    </Text>
                  </View>
                </View>

                <View style={styles.previewButtons}>
                  <TouchableOpacity
                    style={[
                      styles.previewButton,
                      {
                        backgroundColor: customColors.action,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.previewButtonText,
                        { color: customColors.text },
                      ]}
                    >
                      Action
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.previewButton,
                      {
                        backgroundColor: customColors.primary,
                        opacity: 0.3,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.previewButtonText,
                        { color: customColors.text },
                      ]}
                    >
                      Secondaire
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Save Button */}
          <View
            style={[
              styles.modalButtonContainer,
              {
                backgroundColor: colors.secondary,
                borderTopColor: colors.tertiary,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  backgroundColor: colors.action,
                },
              ]}
              onPress={handleSaveCustomTheme}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>
                Enregistrer et Appliquer
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  settingContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
    width: 24,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  toggle: {
    marginLeft: 12,
  },
  // Theme Selection Styles
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  themeListContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  themeListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  themeListLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  themeColorsRow: {
    flexDirection: "row",
    gap: 6,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  themeOption: {
    flex: 1,
    minWidth: "32%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    paddingBottom: 8,
  },
  themeOptionSelected: {
    borderWidth: 3,
  },
  themePreviewContainer: {
    flexDirection: "row",
    height: 50,
    marginBottom: 4,
  },
  themeColorSample: {
    borderRadius: 0,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  themeCheckmark: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  // Theme Preview Section Styles
  themePreviewSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  previewSmallText: {
    fontSize: 12,
  },
  previewButtons: {
    flexDirection: "row",
    gap: 8,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Custom Color Picker Styles
  pickerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  pickerDescription: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  colorInputsContainer: {
    marginBottom: 24,
  },
  colorInputGroup: {
    marginBottom: 16,
  },
  colorInputLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  colorLabelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  colorInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "monospace",
  },
  pickerPreviewSection: {
    marginBottom: 24,
  },
  modalButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Color Card and Palette Styles
  colorCard: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  colorCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  colorPalette: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#404040",
    gap: 0,
    justifyContent: "space-between",
  },
  colorOption: {
    width: "11%",
    height: 45,
    borderRadius: 6,
    borderWidth: 2,
    marginBottom: 2,
  },
});
