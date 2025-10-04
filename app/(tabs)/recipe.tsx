import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeTokens } from "../../utils/auth";

interface IngredientType {
  id: number;
  name: string;
}

interface Ingredient {
  id: number;
  name: string;
  type: IngredientType;
}

interface RecipeType {
  id: number;
  name: string;
}

interface RecipeIngredient {
  id: number;
  ingredient: Ingredient;
  quantity: number;
  unit: { id: number; name: string } | null;
}

interface Recipe {
  id: number;
  name: string;
  type: RecipeType;
  ingredients: RecipeIngredient[];
}

const RecipeCard: React.FC<{ item: Recipe; listName: string }> = ({
  item,
  listName,
}) => {
  const router = useRouter();

  // Fonction pour ajouter la recette à la liste de courses
  const addToShoppingList = async () => {
    try {
      const api = process.env.EXPO_PUBLIC_API;
      const token = process.env.EXPO_PUBLIC_TOKEN;
      const res = await fetch(`${api}shopping-lists/add-recipe/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          recipe_id: Number(item.id),
          list_name: listName,
        }),
      });
      const text = await res.text();
      console.log("API response:", res.status, text);
      if (!res.ok) {
        const errorData = await res.json();
        console.log("Erreur: " + JSON.stringify(errorData));
      } else {
        console.log("Recette ajoutée à la liste de courses !");
      }
    } catch (e) {
      console.log("Erreur lors de l'ajout à la liste de courses");
    }
  };

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/recipeForm",
          params: {
            mode: "edit",
            id: item.id.toString(),
          },
        })
      }
    >
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.type.name}</Text>
          <Text style={styles.cardSubtitle}>
            {item.ingredients.length} ingredients
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addToListButton}
          onPress={(e) => {
            e.stopPropagation && e.stopPropagation();
            addToShoppingList();
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

function RecipeScreen() {
  const api = process.env.EXPO_PUBLIC_API;
  const token = process.env.EXPO_PUBLIC_TOKEN;

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [types, setTypes] = useState<RecipeType[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<RecipeType | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const filtered = recipes.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (!selectedType || r.type.id === selectedType.id)
  );
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api}recipes/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });
      const json = await response.json();
      setRecipes(json.results || []);
    } catch (error) {
      console.error("Loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch(`${api}recipe-types/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });
      const json = await response.json();
      setTypes(json.results || []);
    } catch (error) {
      console.error("Type loading error:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      setUserLoading(true);
      const accessToken = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${api}user-data/`, {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          "Content-Type": "application/json",
        },
      });
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Réponse inattendue du serveur: " + text);
      }
      setUserData(data);
    } catch (e) {
      setUserData(null);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTypes();
    fetchUserData();
  }, []);

  // Récupère dynamiquement le nom de la famille et de la liste de courses
  const families = userData?.families || [];
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const shoppingLists = userData?.shopping_lists || [];
  const [selectedShoppingList, setSelectedShoppingList] = useState<any>(null);
  const [showShoppingListPicker, setShowShoppingListPicker] = useState(false);
  useEffect(() => {
    if (families.length > 0) {
      setSelectedFamily(families[0]);
    }
    if (shoppingLists.length > 0) {
      setSelectedShoppingList(shoppingLists[0]);
    }
  }, [userData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipes</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await removeTokens();
            router.replace("/login");
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Bloc famille et liste de courses */}
      <View style={styles.infoBlocksRow}>
        <TouchableOpacity
          style={styles.infoBlock}
          onPress={() => setShowFamilyPicker((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.infoBlockLabel}>Famille</Text>
          <Text style={styles.infoBlockValue}>
            {selectedFamily?.name || "-"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.infoBlock}
          onPress={() => setShowShoppingListPicker((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.infoBlockLabel}>Liste de courses</Text>
          <TextInput
            style={styles.listNameInput}
            value={selectedShoppingList?.name || ""}
            onChangeText={(name) => {
              setSelectedShoppingList({ ...selectedShoppingList, name });
            }}
            placeholder="Nom de la liste"
            placeholderTextColor="#888"
            editable={!!selectedShoppingList}
          />
        </TouchableOpacity>
      </View>

      {showFamilyPicker && families.length > 0 && (
        <View style={styles.typePickerBlock}>
          {families.map((fam: any) => (
            <TouchableOpacity
              key={fam.id}
              style={styles.typePickerItem}
              onPress={() => {
                setSelectedFamily(fam);
                setShowFamilyPicker(false);
              }}
            >
              <Text style={styles.typePickerText}>{fam.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showShoppingListPicker && shoppingLists.length > 0 && (
        <View style={styles.typePickerBlock}>
          {shoppingLists.map((list: any) => (
            <TouchableOpacity
              key={list.id}
              style={styles.typePickerItem}
              onPress={() => {
                setSelectedShoppingList(list);
                setShowShoppingListPicker(false);
              }}
            >
              <Text style={styles.typePickerText}>{list.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.typeButton}
          onPress={() => setShowTypePicker((v) => !v)}
        >
          <Text style={styles.typeButtonText}>
            {selectedType ? selectedType.name : "Type"}
          </Text>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher"
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      {showTypePicker && (
        <View style={styles.typePickerBlock}>
          {types.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.typePickerItem}
              onPress={() => {
                setSelectedType(type);
                setShowTypePicker(false);
              }}
            >
              <Text style={styles.typePickerText}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="orangered" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          numColumns={1}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <RecipeCard
              item={item}
              listName={selectedShoppingList?.name || ""}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/recipeForm?mode=create")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  infoBlocksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  infoBlock: {
    backgroundColor: "#232323",
    borderRadius: 12,
    padding: 14,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#898989",
  },
  infoBlockLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  infoBlockValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listNameInput: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "#232323",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 2,
    width: "100%",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#131313",
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "600", color: "#fff" },
  logoutButton: {
    padding: 8,
    backgroundColor: "#333",
    borderRadius: 8,
    marginLeft: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    flex: 1,
    height: 44,
    padding: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  typeButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#898989",
  },
  typeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  typePickerBlock: {
    backgroundColor: "#232323",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  typePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  typePickerText: {
    color: "#fff",
    fontSize: 15,
  },
  grid: { gap: 1 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 12,
    margin: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: "500", color: "#fff" },
  cardSubtitle: { fontSize: 12, color: "#aaa", marginTop: 8 },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "orangered",
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
  addToListButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "orangered",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 12,
    alignSelf: "stretch",
    justifyContent: "center",
    height: "100%",
  },
  addToListText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
});

export default RecipeScreen;
