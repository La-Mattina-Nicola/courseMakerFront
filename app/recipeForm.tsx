import { Colors } from "@/constants/theme";
import { getAccessToken } from "@/utils/auth";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

const api = Constants?.expoConfig?.extra?.API_URL || "";

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
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal pour la sélection d'unité
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [unitModalIndex, setUnitModalIndex] = useState<number | null>(null);
  // Ingredient type creation modal state
  const [newIngredientName, setNewIngredientName] = useState("");
  const [selectedIngredientType, setSelectedIngredientType] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showCreateIngredient, setShowCreateIngredient] = useState(false);
  const [pendingTypeId, setPendingTypeId] = useState<number | null>(null);

  const router = useRouter();
  const { mode, id } = useLocalSearchParams<{
    mode: "create" | "edit";
    id?: string;
  }>();

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const token = await getAccessToken();
        const headers = {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        };
        const [unitRes, typeRes] = await Promise.all([
          fetch(`${api}units/`, { headers }),
          fetch(`${api}recipe-types/`, { headers }),
        ]);
        const unitType = unitRes.headers.get("content-type") || "";
        const typeType = typeRes.headers.get("content-type") || "";
        let unitJson = null;
        let typeJson = null;
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
        setAvailableUnits(unitJson.results || []);
        setAvailableTypes(typeJson.results || []);
        // Ne sélectionne pas ici, laisse le useEffect suivant gérer la sélection
      } catch (err) {
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
          const token = await getAccessToken();
          const headers = {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
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
          // Stocke l'id du type à sélectionner
          if (json.type) setPendingTypeId(json.type.id);
        } catch (err) {}
      }
    };
    fetchRecipe();
  }, [mode, id]);

  // Sélectionne le type de plat dès que les deux sont chargés
  useEffect(() => {
    if (pendingTypeId && availableTypes.length > 0) {
      const foundType = availableTypes.find((t) => t.id === pendingTypeId);
      if (foundType) setSelectedType(foundType);
      setPendingTypeId(null);
    } else if (
      !pendingTypeId &&
      availableTypes.length > 0 &&
      mode === "create"
    ) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, pendingTypeId, mode]);

  // Logic for modals and handlers
  const [loadingIngredientSearch, setLoadingIngredientSearch] = useState(false);
  const handleIngredientSearch = async () => {
    const query = ingredientSearch.trim();
    if (query.length === 0) {
      setIngredientResults([]);
      return;
    }
    setLoadingIngredientSearch(true);
    try {
      const token = await getAccessToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };
      const res = await fetch(
        `${api}ingredients/?search=${encodeURIComponent(query)}`,
        { headers }
      );
      if (!res.ok) throw new Error("Erreur API ingrédients");
      const json = await res.json();
      setIngredientResults(json.results || []);
    } catch (err) {
      setIngredientResults([]);
    } finally {
      setLoadingIngredientSearch(false);
    }
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
      const token = await getAccessToken();
      const res = await fetch(`${api}recipes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      if (!res.ok) {
        throw new Error("Erreur API: " + text);
      }
      let data = null;
      if (contentType.includes("application/json")) {
        data = JSON.parse(text);
      }
      router.back();
    } catch (err) {
      Alert.alert("Erreur", String(err));
    }
  };

  // Create ingredient handler
  const handleCreateIngredient = async (options?: {
    name?: string;
    typeId?: number;
  }) => {
    const ingredientName = options?.name ?? ingredientSearch.trim();
    const typeId = options?.typeId ?? selectedIngredientType?.id;
    if (!ingredientName || !typeId) return;
    try {
      const token = await getAccessToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };
      const body = JSON.stringify({
        name: ingredientName,
        type: typeId, // send only the id
      });
      const res = await fetch(`${api}ingredients/`, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Erreur lors de la création de l'ingrédient");
      }
      const created = await res.json();
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
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.logoutIcon}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.homeTitle}>
          {" "}
          {mode === "create" ? "Création de recette" : "Edition de recette"}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.title}></Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de la recette"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
          {/* Sélection du type de plat */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "#fff", marginBottom: 6 }}>
              Type de plat :
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              {availableTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={{
                    backgroundColor:
                      selectedType?.id === type.id
                        ? Colors.dark.action
                        : "#333",
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
            </ScrollView>
          </View>

          {ingredients.map((entry, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={styles.quantityInput}
                placeholder="Quantité"
                keyboardType="numeric"
                value={entry.quantity}
                onChangeText={(val) => updateIngredient(index, "quantity", val)}
              />
              <TouchableOpacity
                style={styles.selector}
                onPress={() => showUnitPicker(index)}
              >
                <Text style={styles.selectorText}>
                  {entry.unit?.name || "unité ?"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectorIngredient}
                onPress={() => showIngredientPicker(index)}
              >
                <Text style={styles.selectorText}>
                  {entry.ingredient?.name || "Sélection de l'ingrédient"}
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
                  />
                  <TouchableOpacity
                    style={styles.ingredientModalSendButton}
                    onPress={handleIngredientSearch}
                    disabled={loadingIngredientSearch}
                  >
                    <MaterialIcons
                      name="send"
                      size={24}
                      color={Colors.dark.action}
                    />
                  </TouchableOpacity>
                </View>
                {/* Affiche les résultats de la recherche d'ingrédients */}
                {ingredientResults.length > 0 && !showCreateIngredient && (
                  <View style={styles.ingredientModalResults}>
                    {ingredientResults.map((ing) => (
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
                    ))}
                  </View>
                )}
                {/* Redirige vers ingredientForm si aucun résultat */}
                {!showCreateIngredient && (
                  <TouchableOpacity
                    onPress={() => {
                      setIngredientModalVisible(false);
                      setShowCreateIngredient(false);
                      setNewIngredientName("");
                      setSelectedIngredientType(null);
                      router.push({
                        pathname: "/ingredientForm",
                        params: { search: ingredientSearch },
                      });
                    }}
                    style={{ alignItems: "center", marginTop: 16 }}
                  >
                    <Text
                      style={{
                        color: "#aaa",
                        textAlign: "center",
                        marginBottom: 8,
                      }}
                    >
                      L'ingredient ne correspond pas ? Crée ton ingrédient.
                    </Text>
                    <View
                      style={{
                        backgroundColor: Colors.dark.action,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Aller à la création
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.ingredientModalClose}
                  onPress={() => {
                    setIngredientModalVisible(false);
                    setShowCreateIngredient(false);
                    setNewIngredientName("");
                    setSelectedIngredientType(null);
                    setIngredientResults([]);
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
          {!ingredientModalVisible &&
            !unitModalVisible &&
            !typeModalVisible && (
              <>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addIngredient}
                >
                  <Text>Ajouter un ingrédient</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitRecipe}
                >
                  <Text style={styles.submitText}>Sauvegarder la recette</Text>
                </TouchableOpacity>
              </>
            )}
        </ScrollView>
      </View>
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
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.dark.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.tertiary,
    marginBottom: 16,
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  logoutIcon: {
    padding: 4,
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
    backgroundColor: Colors.dark.action,
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
    width: 80,
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
    width: 80,
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
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
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
    backgroundColor: Colors.dark.action,
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
