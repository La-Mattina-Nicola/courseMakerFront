import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";
import { removeTokens } from "../../utils/auth";

interface RecipeType {
  id: number;
  name: string;
}

// Define the Recipe interface
interface Recipe {
  id: number;
  name: string;
  type: RecipeType;
  ingredients: any[]; // Replace 'any' with your ingredient type if available
  is_favorite?: boolean;
}

interface RecipeCardProps {
  item: Recipe;
  listName: string;
  familyId: number | null;
  favoriteIds: number[];
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  item,
  listName,
  familyId,
  favoriteIds,
}) => {
  const router = useRouter();

  // Fonction pour ajouter la recette à la liste de courses
  const [showSuccess, setShowSuccess] = useState(false);

  const addToShoppingList = async () => {
    try {
      const api = Constants?.expoConfig?.extra?.API_URL || "";
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        return;
      }
      const res = await fetch(`${api}shopping-lists/add-recipe/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipe_id: Number(item.id),
          list_name: listName,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (e) {}
  };

  // Success modal
  useEffect(() => {
    // Cleanup on unmount
    return () => setShowSuccess(false);
  }, []);

  return (
    <>
      <TouchableOpacity
        onLongPress={() => {
          Alert.alert("WIP", "Recette ajoutée aux favoris !");
        }}
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
          <View style={styles.cardFav}>
            <Ionicons
              name={item.is_favorite ? "star" : "star-outline"}
              size={24}
              color={item.is_favorite ? "#FFD700" : Colors.dark.icon}
            />
          </View>
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
      {showSuccess && (
        <View
          style={{
            position: "absolute",
            bottom: 30,
            left: 20,
            right: 20,
            backgroundColor: "#2ecc40",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            zIndex: 999,
            elevation: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Recette ajoutée à la liste de courses !
          </Text>
        </View>
      )}
    </>
  );
};

const RecipeScreen: React.FC = () => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const api = Constants?.expoConfig?.extra?.API_URL || "";
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [types, setTypes] = useState<RecipeType[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<RecipeType | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [typeError, setTypeError] = useState<string | null>(null);
  const router = useRouter();

  // Recherche locale adaptée (comme ingredient.tsx)
  const filtered = recipes
    .filter((r) => {
      if (selectedType) {
        if (typeof r.type === "number") {
          return r.type === selectedType.id;
        } else if (typeof r.type === "object" && r.type?.id) {
          return r.type.id === selectedType.id;
        }
        return false;
      }
      return true;
    })
    .filter((r) => {
      const searchLower = search.toLowerCase();
      const nameMatch = r.name.toLowerCase().includes(searchLower);
      let typeMatch = false;
      if (typeof r.type === "object" && r.type?.name) {
        typeMatch = r.type.name.toLowerCase().includes(searchLower);
      }
      return nameMatch || typeMatch;
    });

  // Nouvelle fonction pour charger toutes les recettes (toutes pages)
  const fetchAllRecipes = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      // Fetch families to get favorite_recipes FIRST
      const famRes = await fetch(`${api}families/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const famJson = await famRes.json();
      const favoriteRecipes =
        famJson.favorite_recipes || famJson[0]?.favorite_recipes || [];
      const ids = favoriteRecipes.map((r: any) => r.id);
      setFavoriteIds(ids);

      // Fetch all recipes (all pages)
      let allRecipes: any[] = [];
      let nextUrl: string | null = `${api}recipes/?page_size=1000`;
      while (nextUrl) {
        const res = await fetch(nextUrl, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const json: any = await res.json();
        allRecipes = allRecipes.concat(json.results || []);
        nextUrl = json.next;
      }

      // Split recipes into favorites and others
      const favoriteRecipesList = allRecipes
        .filter((r: any) => ids.includes(r.id))
        .map((r: any) => ({ ...r, is_favorite: true }));
      const otherRecipesList = allRecipes
        .filter((r: any) => !ids.includes(r.id))
        .map((r: any) => ({ ...r, is_favorite: false }));

      setRecipes([...favoriteRecipesList, ...otherRecipesList]);
    } catch (error) {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      setTypeError(null);
      const url = `${api}recipe-types/`;
      const accessToken = await AsyncStorage.getItem("accessToken");
      const response = await fetch(url, {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const json = await response.json();
      setTypes(json.results || []);
    } catch (error: any) {
      setTypeError(error?.message || String(error));
    }
  };

  const fetchUserData = async () => {
    setUserLoading(true);
    try {
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

  useFocusEffect(
    React.useCallback(() => {
      fetchAllRecipes();
      fetchTypes();
      fetchUserData();
    }, [])
  );

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
      <View style={styles.fixedHeader}>
        <Text style={styles.homeTitle}>RECETTE</Text>
        <TouchableOpacity
          style={styles.logoutIcon}
          onPress={async () => {
            await removeTokens();
            router.replace("/login");
          }}
        >
          <Ionicons name="log-out-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bloc famille et liste de courses */}
      <View style={[styles.infoBlocksRow, { marginTop: 70 }]}>
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
          <Text style={styles.infoBlockValue}>
            {selectedShoppingList?.name || "-"}
          </Text>
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
              <Text style={styles.typePickerText}>
                {list.name}
                {(() => {
                  const fam = families.find((f: any) => f.id === list.family);
                  return fam && fam.name ? ` (${fam.name})` : "";
                })()}
              </Text>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
            style={{ maxHeight: 60 }}
          >
            <TouchableOpacity
              style={[
                styles.typeTile,
                !selectedType && styles.typeTileSelected,
              ]}
              onPress={() => {
                setSelectedType(null);
                setShowTypePicker(false);
              }}
            >
              <Text
                style={[
                  styles.typeTileText,
                  !selectedType && styles.typeTileTextSelected,
                ]}
              >
                Tous les types
              </Text>
            </TouchableOpacity>
            {types.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeTile,
                  selectedType?.id === type.id && styles.typeTileSelected,
                ]}
                onPress={() => {
                  setSelectedType(type);
                  setShowTypePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.typeTileText,
                    selectedType?.id === type.id && styles.typeTileTextSelected,
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
              familyId={selectedFamily?.id || null}
              favoriteIds={favoriteIds}
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
      {typeError && (
        <View
          style={{
            backgroundColor: "#fee",
            padding: 12,
            margin: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#b00", fontWeight: "bold" }}>
            Erreur chargement types : {typeError}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  listNameInput: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 2,
    width: "100%",
    textAlign: "center",
    borderWidth: 2,
    borderColor: Colors.dark.tertiary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.dark.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.tertiary,
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
  cardFav: {
    width: "15%",
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.dark.tertiary,
    borderRadius: 10,
    padding: 12,
    margin: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: "500", color: Colors.dark.text },
  cardSubtitle: { fontSize: 12, color: Colors.dark.icon, marginTop: 8 },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: Colors.dark.action,
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },

  addToListText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.tertiary,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    marginBottom: 12,
  },
  pageButton: {
    flex: 1,
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  pageButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  pageInfo: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "500",
  },

  addToListButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 12,
    alignSelf: "stretch",
    justifyContent: "center",
    height: "100%",
  },
});

export default RecipeScreen;
