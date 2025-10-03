import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="recipe"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
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
        name="ingredients"
        options={{
          title: "Ingredients",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="food-bank" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipe"
        options={{
          title: "Recipe",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="code" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
