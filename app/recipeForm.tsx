import { Ionicons } from "@expo/vector-icons";
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

// ...existing types...
type Ingredient = {
  id: number;
  name: string;
};

type Unit = {
  id: number;
  name: string;
};

type RecipeType = {
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
  // Type de plat (RecipeType)
  const [availableTypes, setAvailableTypes] = useState<RecipeType[]>([]);
  const [selectedType, setSelectedType] = useState<RecipeType | null>(null);
  // Modal pour ajout de type de plat
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  // Modal pour la sélection d'ingrédient
  const [ingredientModalVisible, setIngredientModalVisible] = useState(false);
  const [ingredientModalIndex, setIngredientModalIndex] = useState<
    number | null
  >(null);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientResults, setIngredientResults] = useState<Ingredient[]>([]);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal pour la sélection d'unité
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [unitModalIndex, setUnitModalIndex] = useState<number | null>(null);
  // Ingredient type creation modal state
  const [ingredientTypes, setIngredientTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [selectedIngredientType, setSelectedIngredientType] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showCreateIngredient, setShowCreateIngredient] = useState(false);

  const router = useRouter();
  const { mode, id } = useLocalSearchParams<{
    mode: "create" | "edit";
    id?: string;
  }>();

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        };
        const [ingRes, unitRes, typeRes] = await Promise.all([
          fetch(`${api}ingredients/`, { headers }),
          fetch(`${api}units/`, { headers }),
          fetch(`${api}recipe-types/`, { headers }),
        ]);
        const ingType = ingRes.headers.get("content-type") || "";
        const unitType = unitRes.headers.get("content-type") || "";
        const typeType = typeRes.headers.get("content-type") || "";
        let ingJson = null;
        let unitJson = null;
        let typeJson = null;
        if (ingType.includes("application/json")) {
          ingJson = await ingRes.json();
        } else {
          throw new Error("Erreur API ingrédients");
        }
        if (unitType.includes("application/json")) {
          unitJson = await unitRes.json();
        } else {
          throw new Error("Erreur API unités");
        }
        if (typeType.includes("application/json")) {
          typeJson = await typeRes.json();
        } else {
          throw new Error("Erreur API types");
        }
        setAvailableIngredients(ingJson.results || []);
        setAvailableUnits(unitJson.results || []);
        setAvailableTypes(typeJson.results || []);
        if (typeJson.results && typeJson.results.length > 0)
          setSelectedType(typeJson.results[0]);
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
          // Préselectionne le bon type de plat si disponible
          if (json.type && availableTypes.length > 0) {
            const foundType = availableTypes.find((t) => t.id === json.type.id);
            if (foundType) setSelectedType(foundType);
          }
        } catch (err) {
          console.error("Error loading recipe", err);
        }
      }
    };
    fetchRecipe();
  }, [mode, id, availableTypes]);

  // Logic for modals and handlers
  const handleIngredientSearch = () => {
    const query = ingredientSearch.trim().toLowerCase();
    if (query.length === 0) {
      setIngredientResults([]);
      return;
    }
    setIngredientResults(
      availableIngredients.filter((ing) =>
        ing.name.toLowerCase().includes(query)
      )
    );
  };

  const showIngredientPicker = (index: number) => {
    setIngredientModalIndex(index);
    setIngredientModalVisible(true);
    setIngredientSearch("");
  };

  const showUnitPicker = (index: number) => {
    setUnitModalIndex(index);
    setUnitModalVisible(true);
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

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    const newType: RecipeType = {
      id: Date.now(), // temp id, backend should assign real id
      name: trimmed,
    };
    setAvailableTypes([...availableTypes, newType]);
    setSelectedType(newType);
    setTypeModalVisible(false);
    setNewTypeName("");
  };

  const submitRecipe = async () => {
    // Préparer les ingrédients au format attendu
    const validIngredients = ingredients
      .filter(
        (i) =>
          i.selected &&
          i.ingredient &&
          i.ingredient.id &&
          i.unit &&
          i.unit.id &&
          i.quantity
      )
      .map((i) => ({
        ingredient: i.ingredient?.id,
        quantity: parseFloat(i.quantity),
        unit: i.unit?.id,
      }));

    const payload = {
      name,
      type: selectedType?.id || null,
      ingredients: validIngredients,
    };

    try {
      const res = await fetch(`${api}recipes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      console.log("API response:", res.status, text);
      if (!res.ok) {
        throw new Error("Erreur API: " + text);
      }
      let data = null;
      if (contentType.includes("application/json")) {
        data = JSON.parse(text);
        console.log("Success:", data);
      } else {
        console.log("Réponse non JSON:", text);
      }
      router.back();
    } catch (err) {
      console.error("Error submitting recipe", err);
      Alert.alert("Erreur", String(err));
    }
  };

  // Load ingredient types when showing create ingredient UI
  const fetchIngredientTypes = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      };
      const res = await fetch(`${api}ingredient-types/`, { headers });
      const json = await res.json();
      setIngredientTypes(json.results || []);
    } catch (err) {
      console.error("Error loading ingredient types", err);
    }
  };

  // Create ingredient handler
  const handleCreateIngredient = async () => {
    console.log("test");
    if (!ingredientSearch.trim() || !selectedIngredientType) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      };
      const body = JSON.stringify({
        name: ingredientSearch.trim(),
        type: selectedIngredientType.id, // send only the id
      });
      console.log(body);
      const res = await fetch(`${api}ingredients/`, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.log("API error:", errorText);
        throw new Error("Erreur lors de la création de l'ingrédient");
      }
      const created = await res.json();
      console.log("Réponse API:", created);
      setAvailableIngredients([...availableIngredients, created]);
      if (ingredientModalIndex !== null) {
        updateIngredient(ingredientModalIndex, "ingredient", created);
      }
      setShowCreateIngredient(false);
      setNewIngredientName("");
      setSelectedIngredientType(null);
      setIngredientModalVisible(false);
    } catch (err) {
      Alert.alert("Erreur", String(err));
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
      {/* Sélection du type de plat */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: "#fff", marginBottom: 6 }}>Type de plat :</Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {availableTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={{
                backgroundColor:
                  selectedType?.id === type.id ? "orangered" : "#333",
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 16,
                marginRight: 8,
                marginBottom: 8,
              }}
              onPress={() => setSelectedType(type)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{
              backgroundColor: "#333",
              borderRadius: 8,
              padding: 8,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 8,
              marginBottom: 8,
            }}
            onPress={() => setTypeModalVisible(true)}
            accessibilityLabel="Ajouter un type de plat"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Modal ajout type de plat */}
      {typeModalVisible && (
        <View style={styles.typeModalOverlay}>
          <View style={styles.typeModalContent}>
            <Text style={styles.typeModalTitle}>Ajouter un type de plat</Text>
            <TextInput
              style={styles.typeModalInput}
              placeholder="Nom du type"
              placeholderTextColor="#888"
              value={newTypeName}
              onChangeText={setNewTypeName}
              autoFocus
            />
            <TouchableOpacity
              style={styles.typeModalAddButton}
              onPress={handleAddType}
            >
              <Text style={styles.typeModalAddButtonText}>Ajouter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.typeModalClose}
              onPress={() => setTypeModalVisible(false)}
            >
              <Text style={styles.typeModalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
            onPress={() => showIngredientPicker(index)}
          >
            <Text style={styles.selectorText}>
              {entry.ingredient?.name || "Select Ingredient"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      {/* Modal de sélection d'ingrédient avec recherche */}
      {ingredientModalVisible && (
        <View style={styles.ingredientModalOverlay}>
          <View style={styles.ingredientModalContent}>
            <Text style={styles.ingredientModalTitle}>
              Choisir un ingrédient
            </Text>
            <View style={styles.ingredientModalSearchRow}>
              <TextInput
                style={styles.ingredientModalSearchInput}
                placeholder="Rechercher..."
                placeholderTextColor="#888"
                value={ingredientSearch}
                onChangeText={setIngredientSearch}
                autoFocus={!showCreateIngredient}
                editable={!showCreateIngredient}
              />
              <TouchableOpacity
                style={styles.ingredientModalSendButton}
                onPress={handleIngredientSearch}
                disabled={showCreateIngredient}
              >
                <Ionicons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.ingredientModalResults}>
              {ingredientResults.length === 0 && ingredientSearch.trim() ? (
                <Text
                  style={{ color: "#aaa", textAlign: "center", marginTop: 12 }}
                ></Text>
              ) : (
                ingredientResults.map((ing) => (
                  <TouchableOpacity
                    key={ing.id}
                    style={styles.ingredientModalItem}
                    onPress={() => {
                      if (ingredientModalIndex !== null) {
                        updateIngredient(
                          ingredientModalIndex,
                          "ingredient",
                          ing
                        );
                      }
                      setIngredientModalVisible(false);
                    }}
                  >
                    <Text style={styles.ingredientModalItemText}>
                      {ing.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            {/* Button to show create ingredient UI */}
            {!showCreateIngredient && (
              <TouchableOpacity
                style={[styles.ingredientModalSendButton, { marginTop: 8 }]}
                onPress={() => {
                  setShowCreateIngredient(true);
                  fetchIngredientTypes();
                }}
              >
                <Text style={{ color: "#fff" }}>
                  Créer un nouvel ingrédient
                </Text>
              </TouchableOpacity>
            )}
            {/* Create ingredient UI - separate input */}
            {showCreateIngredient && (
              <View style={{ width: "100%", marginTop: 12 }}>
                <Text style={{ color: "#fff", marginTop: 8 }}>Type :</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {ingredientTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={{
                        backgroundColor:
                          selectedIngredientType?.id === type.id
                            ? "orangered"
                            : "#333",
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                      onPress={() => setSelectedIngredientType(type)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.ingredientModalSendButton, { marginTop: 12 }]}
                  onPress={() => {
                    console.log("Bouton créer ingrédient pressé");
                    handleCreateIngredient();
                  }}
                  disabled={!ingredientSearch.trim() || !selectedIngredientType}
                >
                  <Text style={{ color: "#fff" }}>Créer l'ingrédient</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.ingredientModalClose}
              onPress={() => {
                setIngredientModalVisible(false);
                setShowCreateIngredient(false);
                setNewIngredientName("");
                setSelectedIngredientType(null);
              }}
            >
              <Text style={styles.ingredientModalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Modal de sélection d'unité */}
      {unitModalVisible && (
        <View style={styles.unitModalOverlay}>
          <View style={styles.unitModalContent}>
            <Text style={styles.unitModalTitle}>Choisir une unité</Text>
            {availableUnits.map((unit) => (
              <TouchableOpacity
                key={unit.id}
                style={styles.unitModalItem}
                onPress={() => {
                  if (unitModalIndex !== null) {
                    updateIngredient(unitModalIndex, "unit", unit);
                  }
                  setUnitModalVisible(false);
                }}
              >
                <Text style={styles.unitModalItemText}>{unit.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.unitModalClose}
              onPress={() => setUnitModalVisible(false)}
            >
              <Text style={styles.unitModalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Show buttons only if no modal is open */}
      {!ingredientModalVisible && !unitModalVisible && !typeModalVisible && (
        <>
          <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
            <Text>Add ingredient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={submitRecipe}>
            <Text style={styles.submitText}>Save Recipe</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // ...existing styles for modals, buttons, etc...
  typeModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  typeModalContent: {
    width: "80%",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 24,
    elevation: 4,
  },
  typeModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  typeModalInput: {
    height: 48,
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  typeModalAddButton: {
    backgroundColor: "orangered",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  typeModalAddButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  typeModalClose: {
    alignItems: "center",
    padding: 8,
  },
  typeModalCloseText: {
    color: "#888",
    fontSize: 14,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    color: "#fff",
    marginRight: 8,
  },
  selector: {
    flex: 1,
    height: 40,
    backgroundColor: "#333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  selectorText: {
    color: "#fff",
    fontSize: 16,
  },
  selectorIngredient: {
    flex: 2,
    height: 40,
    backgroundColor: "#333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  ingredientModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  ingredientModalContent: {
    width: "80%",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 24,
    elevation: 4,
  },
  ingredientModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  ingredientModalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ingredientModalSearchInput: {
    flex: 1,
    height: 40,
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    marginRight: 8,
  },
  ingredientModalSendButton: {
    backgroundColor: "orangered",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  ingredientModalResults: {
    maxHeight: 200,
    marginBottom: 16,
  },
  ingredientModalItem: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ingredientModalItemText: {
    color: "#fff",
    fontSize: 16,
  },
  ingredientModalClose: {
    alignItems: "center",
    padding: 8,
  },
  ingredientModalCloseText: {
    color: "#888",
    fontSize: 14,
  },
  unitModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  unitModalContent: {
    width: "80%",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 24,
    elevation: 4,
  },
  unitModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  unitModalItem: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  unitModalItemText: {
    color: "#fff",
    fontSize: 16,
  },
  unitModalClose: {
    alignItems: "center",
    padding: 8,
  },
  unitModalCloseText: {
    color: "#888",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "orangered",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: "green",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottom: {
    flex: 1,
    flexDirection: "column-reverse",
  },
});

export default RecipeForm;
