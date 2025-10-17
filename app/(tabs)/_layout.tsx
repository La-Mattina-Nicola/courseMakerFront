import { createDrawerNavigator } from "@react-navigation/drawer";
import { Tabs } from "expo-router";
import React from "react";

import DrawerContent from "@/app/drawer";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const Drawer = createDrawerNavigator();

export default function TabLayout() {
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
              tabBarActiveTintColor: Colors.dark.tint,
              tabBarStyle: {
                backgroundColor: Colors.dark.background,
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
