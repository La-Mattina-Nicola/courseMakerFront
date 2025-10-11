import { Colors } from "@/constants/theme";
import { getAccessToken } from "@/utils/auth";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

let api = Constants?.expoConfig?.extra?.API_URL || "";
if (api.endsWith("/")) api = api.slice(0, -1);

type IngredientType = { id: number; name: string };

type IngredientPayload = {
  name: string;
  type: number;
};

type IngredientTypeApi = { id: number; name: string };

const fetchIngredientTypes = async () => {
  try {
    const token = await getAccessToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
    const res = await fetch(`${api}/ingredient-types/`, { headers });
    if (!res.ok)
      throw new Error("Erreur lors du chargement des types d'ingrédient");
    const json = await res.json();
    // On attend un objet avec results: IngredientTypeApi[]
    return json;
  } catch (e: any) {
    throw new Error(e.message || "Erreur inconnue");
  }
};

const useIngredientTypes = () => {
  const [types, setTypes] = useState<IngredientTypeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIngredientTypes()
      .then((data) => {
        setTypes(data.results || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { types, loading, error };
};

type IngredientTypePickerProps = {
  selectedType: number | null;
  setSelectedType: (type: number) => void;
};

const IngredientForm = () => {
  const { search } = useLocalSearchParams<{ search: string }>();
  const [ingredientName, setIngredientName] = useState<string>(search);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (search) setIngredientName(search);
  }, [search]);

  const { types, loading, error } = useIngredientTypes();

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.logoutIcon}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Créer un ingrédient</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nom de l'ingrédient"
        placeholderTextColor="#888"
        value={ingredientName}
        editable={true}
        onChangeText={setIngredientName}
        autoFocus
      />

      {/* Sélecteur de type d'ingrédient */}
      <View>
        <Text style={{ color: "#fff", marginBottom: 8 }}>
          Type d'ingrédient
        </Text>
        {loading ? (
          <Text style={{ color: "#888" }}>Chargement...</Text>
        ) : error ? (
          <Text style={{ color: "red" }}>{error}</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {types.map((type) => (
              <Text
                key={type.id}
                style={[
                  {
                    color:
                      selectedType === type.id
                        ? Colors.dark.background
                        : Colors.dark.text,
                    backgroundColor:
                      selectedType === type.id
                        ? Colors.dark.action
                        : Colors.dark.secondary,
                    fontWeight: selectedType === type.id ? "bold" : "normal",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: selectedType === type.id ? 2 : 1,
                    borderColor:
                      selectedType === type.id
                        ? Colors.dark.action
                        : Colors.dark.secondary,
                    overflow: "hidden",
                  },
                  {
                    // Ajoute une ombre légère pour le contraste
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                {type.name}
              </Text>
            ))}
          </View>
        )}
      </View>
      <View
        style={styles.submitButton}
        // Utilise onTouchEnd pour la simplicité, mais TouchableOpacity est recommandé pour un vrai bouton
        onTouchEnd={async () => {
          if (!ingredientName) {
            alert("Veuillez entrer un nom d'ingrédient.");
            return;
          }
          if (!selectedType) {
            alert("Veuillez sélectionner un type d'ingrédient.");
            return;
          }
          try {
            const token = await getAccessToken();

            const payload = {
              name: ingredientName,
              type: selectedType,
            };

            const res = await fetch(`${api}/ingredients/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Erreur lors de la création");
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              router.back();
            }, 2000);
          } catch (e: any) {
            alert(e.message || "Erreur inconnue");
          }
        }}
      >
        <Text style={styles.submitText}>Enregistrer</Text>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Ingrédient créé !</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccess(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.dark.secondary,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  modalText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  infoBlocksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  infoBlock: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    padding: 14,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.action,
  },
  infoBlockLabel: {
    color: Colors.dark.icon,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  infoBlockValue: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: Colors.dark.secondary,
    color: Colors.dark.text,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 80,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingTop: 32,
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
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.text,
    letterSpacing: 1,
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    flex: 1,
    height: 44,
    padding: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  typeButton: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.dark.action,
  },
  typeButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 15,
  },
  typePickerBlock: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  typePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.tertiary,
  },
  typePickerText: {
    color: Colors.dark.text,
    fontSize: 15,
  },
  typeTile: {
    backgroundColor: Colors.dark.tertiary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 4,
    alignItems: "center",
    minWidth: 48,
    borderWidth: 2,
    borderColor: Colors.dark.tertiary,
  },
  typeTileSelected: {
    backgroundColor: Colors.dark.action,
    borderColor: Colors.dark.action,
  },
  typeTileText: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  typeTileTextSelected: {
    color: "#fff",
  },
  grid: { gap: 1 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: { fontSize: 16, fontWeight: "500", color: Colors.dark.text },
  cardSubtitle: { fontSize: 12, color: Colors.dark.icon, marginTop: 8 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  pageButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pageButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 15,
  },
  pageInfo: { marginHorizontal: 12, fontSize: 16 },
  addToListButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    padding: 4,
    alignSelf: "stretch",
    justifyContent: "center",
    height: "100%",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: Colors.dark.action,
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default IngredientForm;
