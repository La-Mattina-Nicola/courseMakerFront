import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Ingredient = {
  id: number;
  name: string;
};

type Unit = {
  id: number;
  name: string;
};

type RecipeIngredient = {
  id: number;
  ingredient: Ingredient;
  quantity: number;
  unit: Unit | null;
};

type IngredientEntry = {
  ingredient: Ingredient | null;
  quantity: string;
  unit: Unit | null;
  selected: boolean;
};

const api = process.env.EXPO_PUBLIC_API;
const token = process.env.EXPO_PUBLIC_TOKEN;

const RecipeForm = () => {
  const router = useRouter();
  const { mode, id } = useLocalSearchParams<{
    mode: "create" | "edit";
    id?: string;
  }>();

  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        };

        const [ingRes, unitRes] = await Promise.all([
          await fetch(`${api}ingredients/`, { headers }),
          await fetch(`${api}units/`, { headers }),
        ]);

        const ingJson = await ingRes.json();
        const unitJson = await unitRes.json();

        if (!ingRes.ok || !unitRes.ok) {
          throw new Error("API returned an error status");
        }
        setAvailableIngredients(ingJson.results || []);
        setAvailableUnits(unitJson.results || []);
      } catch (err) {
        console.log("Error loading metadata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, []);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (mode === "edit" && id) {
        try {
          const headers = {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          };
          const res = await fetch(`${api}recipes/${id}/`, { headers });
          const json = await res.json();
          setName(json.name);
          setIngredients(
            json.ingredients.map((ri: RecipeIngredient) => ({
              ingredient: ri.ingredient,
              quantity: ri.quantity.toString(),
              unit: ri.unit,
              selected: true,
            }))
          );
        } catch (err) {
          console.error("Error loading recipe", err);
        }
      }
    };
    fetchRecipe();
  }, [mode, id]);

  const showUnitPicker = (index: number) => {
    Alert.alert(
      "Choisir une unité",
      "Sélectionne l'unité pour cet ingrédient",
      availableUnits.map((unit) => ({
        text: unit.name,
        onPress: () => updateIngredient(index, "unit", unit),
      })),
      { cancelable: true }
    );
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { ingredient: null, quantity: "", unit: null, selected: true },
    ]);
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientEntry,
    value: any
  ) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setIngredients(updated);
  };

  const submitRecipe = async () => {
    const payload = {
      name,
      ingredients: ingredients
        .filter((i) => i.selected && i.ingredient)
        .map((i) => ({
          ingredient: i.ingredient?.id,
          quantity: parseFloat(i.quantity),
          unit: i.unit?.id || null,
        })),
    };

    const endpoint = mode === "create" ? "recipes/" : `recipes/${id}/`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(`${api}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log("Success:", json);
      router.back(); // Retour à la page précédente
    } catch (err) {
      console.error("Error submitting recipe", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {mode === "create" ? "Create Recipe" : "Edit Recipe"}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Recipe Name"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
      />

      {ingredients.map((entry, index) => (
        <View key={index} style={styles.ingredientRow}>
          <TextInput
            style={styles.quantityInput}
            placeholder="Qty"
            keyboardType="numeric"
            value={entry.quantity}
            onChangeText={(val) => updateIngredient(index, "quantity", val)}
          />
          <TouchableOpacity
            style={styles.selector}
            onPress={() => showUnitPicker(index)}
          >
            <Text style={styles.selectorText}>
              {entry.unit?.name || "Unit"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectorIngredient}
            onPress={() => {
              const next =
                availableIngredients[(index + 1) % availableIngredients.length];
              updateIngredient(index, "ingredient", next);
            }}
          >
            <Text style={styles.selectorText}>
              {entry.ingredient?.name || "Select Ingredient"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
        <Text>Add ingredient</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={submitRecipe}>
        <Text style={styles.submitText}>Save Recipe</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#121212", flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  quantityInput: {
    width: "15%",
    backgroundColor: "#333",
    color: "#fff",
    padding: 8,
    borderRadius: 6,
  },
  selectorIngredient: {
    width: "65%",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
  },
  selector: {
    width: "15%",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
  },
  selectorText: { color: "#fff" },
  addButton: {
    backgroundColor: "#666",
    padding: 12,
    borderRadius: 30,
    alignSelf: "center",
    marginVertical: 16,
  },
  submitButton: {
    backgroundColor: "orangered",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold" },
  dropdown: {
    width: "15%",
    backgroundColor: "#333",
    color: "#fff",
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
  },
});

export default RecipeForm;
