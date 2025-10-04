import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { SectionList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const api = process.env.EXPO_PUBLIC_API;
const token = process.env.EXPO_PUBLIC_TOKEN;

type IngredientTypeDB = {
  id: number;
  name: string;
};

type IngredientDB = {
  id: number;
  name: string;
  type: IngredientTypeDB;
};

type RecipeIngredientDB = {
  id: number;
  ingredient: IngredientDB;
  quantity: number;
  unit: { id: number; name: string } | null;
};

type RecipeDB = {
  id: number;
  name: string;
  type: { id: number; name: string };
  ingredients: RecipeIngredientDB[];
};

type SectionData =
  | { type: "ingredientType"; item: IngredientTypeDB }
  | { type: "ingredient"; item: IngredientDB }
  | { type: "recipe"; item: RecipeDB };

function Ingredients() {
  const [sections, setSections] = useState<
    { title: string; data: SectionData[] }[]
  >([]);

  const fetchAll = async () => {
    const getHeaders = (): HeadersInit => ({
      "Content-Type": "application/json",
      Authorization: `${token}`,
    });

    const [typeRes, ingRes, recRes] = await Promise.all([
      fetch(`${api}ingredient-types/`, { headers: getHeaders() }),
      fetch(`${api}ingredients/`, { headers: getHeaders() }),
      fetch(`${api}recipes/`, { headers: getHeaders() }),
    ]);

    const typeJson = await typeRes.json();
    const ingJson = await ingRes.json();
    const recJson = await recRes.json();

    setSections([
      {
        title: "Ingredient Types",
        data: typeJson.results.map((item: IngredientTypeDB) => ({
          type: "ingredientType",
          item,
        })),
      },
      {
        title: "Ingredients",
        data: ingJson.results.map((item: IngredientDB) => ({
          type: "ingredient",
          item,
        })),
      },
      {
        title: "Recipes",
        data: recJson.results.map((item: RecipeDB) => ({
          type: "recipe",
          item,
        })),
      },
    ]);
  };

  useFocusEffect(() => {
    fetchAll();
  });

  const renderItem = ({ item }: { item: SectionData }) => {
    switch (item.type) {
      case "ingredientType":
        return (
          <ThemedView>
            <ThemedText>
              {item.item.id} {item.item.name}
            </ThemedText>
          </ThemedView>
        );
      case "ingredient":
        return (
          <ThemedView>
            <ThemedText>
              {item.item.id} {item.item.name} // {item.item.type.name}
            </ThemedText>
          </ThemedView>
        );
      case "recipe":
        return (
          <ThemedView>
            <ThemedText style={styles.subTitle}>
              {item.item.id} — {item.item.name}
            </ThemedText>
            {item.item.ingredients.map((ri) => (
              <ThemedText key={ri.id}>
                • {ri.ingredient.name} ({ri.ingredient.type.name})
              </ThemedText>
            ))}
          </ThemedView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        contentContainerStyle={styles.contentContainer}
        sections={sections}
        keyExtractor={(item, index) => `${item.type}-${item.item.id}-${index}`}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <ThemedText style={styles.title}>{title} :</ThemedText>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#121212",
    flex: 1,
  },
  contentContainer: {
    margin: 10,
    backgroundColor: "#121212",
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    paddingVertical: 4,
  },
  subTitle: {
    fontSize: 18,
  },
});

export default Ingredients;
