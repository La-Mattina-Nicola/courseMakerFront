import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { removeTokens } from "../../utils/auth";

export default function DrawerContent({ navigation }: any) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const handleLogout = async () => {
    await removeTokens();
    navigation?.closeDrawer();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="menu" size={32} color={colors.text} />
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/user");
          }}
        >
          <Ionicons name="person" size={24} color={colors.action} />
          <Text style={styles.menuItemText}>Mon Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/family");
          }}
        >
          <Ionicons name="people" size={24} color={colors.action} />
          <Text style={styles.menuItemText}>Famille</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/settings");
          }}
        >
          <Ionicons name="settings" size={24} color={colors.action} />
          <Text style={styles.menuItemText}>Paramètres</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color={colors.action} />
          <Text style={[styles.menuItemText, { color: "#ff4444" }]}>
            Déconnexion
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 2,
      borderBottomColor: colors.tertiary,
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: 12,
    },
    menu: {
      flex: 1,
      paddingHorizontal: 12,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
      borderRadius: 8,
      backgroundColor: colors.secondary,
    },
    menuItemText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 16,
      fontWeight: "500",
    },
    footer: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      paddingBottom: 20,
      borderTopWidth: 2,
      borderTopColor: colors.tertiary,
    },
    logoutButton: {
      backgroundColor: "rgba(255, 68, 68, 0.1)",
    },
  });
