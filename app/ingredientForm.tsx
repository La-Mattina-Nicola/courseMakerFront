import { Colors } from "@/constants/theme";
import { getAccessToken } from "@/utils/auth";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

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

  useEffect(() => {
    if (search) setIngredientName(search);
  }, [search]);

  const { types, loading, error } = useIngredientTypes();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un ingrédient</Text>
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
      <View style={{ marginBottom: 16 }}>
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
            alert("Ingrédient créé !");
            router.back();
          } catch (e: any) {
            alert(e.message || "Erreur inconnue");
          }
        }}
      >
        <Text style={styles.submitText}>Enregistrer</Text>
      </View>
    </View>
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
});

export default IngredientForm;
