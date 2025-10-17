import DrawerContent from "@/app/drawer";
import { HapticTab } from "@/components/haptic-tab";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const Drawer = createDrawerNavigator();

export default function TabLayout() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="homeTab"
        options={{
          drawerLabel: "Home",
          title: "Home",
        }}
      >
        {() => (
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: colors.icon,
              tabBarStyle: {
                backgroundColor: colors.primary,
                borderTopColor: "#333",
                borderTopWidth: 2,
              },
              headerShown: false,
              tabBarButton: HapticTab,
            }}
          >
            <Tabs.Screen
              name="home"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="home" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="recipe"
              options={{
                title: "Recette",
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="food-bank" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="ingredient"
              options={{
                title: "Ingredient",
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons
                    name="food-variant"
                    size={24}
                    color={color}
                  />
                ),
              }}
            />
          </Tabs>
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
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
      backgroundColor: colors.tertiary,
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
