import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import { useTheme } from "../../context/ThemeContext";
import { useUserData } from "../../context/UserDataContext";

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
  listId: number | null;
  familyId: number | null;
  favoriteIds: number[];
}

interface RecipeCardMemoProps extends RecipeCardProps {
  onAddToList: (recipeId: number, listId: number | null) => Promise<void>;
  onFavoritePress: (recipeId: number) => Promise<void>;
  colors: any;
}

const RecipeCard: React.FC<RecipeCardMemoProps> = React.memo(
  ({
    item,
    listId,
    familyId,
    favoriteIds,
    onAddToList,
    onFavoritePress,
    colors,
  }) => {
    const router = useRouter();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleAddToShoppingList = React.useCallback(async () => {
      await onAddToList(item.id, listId);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, [item.id, listId, onAddToList]);

    useEffect(() => {
      return () => setShowSuccess(false);
    }, []);

    const handleEditPress = React.useCallback(() => {
      router.push({
        pathname: "/recipeForm",
        params: {
          mode: "edit",
          id: item.id.toString(),
        },
      });
    }, [item.id, router]);

    const handleFavoritePress = React.useCallback(async () => {
      try {
        await onFavoritePress(item.id);
      } catch (error) {
        Alert.alert("Erreur", "Impossible d'ajouter aux favoris");
      }
    }, [item.id, onFavoritePress]);

    return (
      <>
        <TouchableOpacity onPress={handleEditPress}>
          <View style={styles.cardRow}>
            <TouchableOpacity
              onPress={handleFavoritePress}
              style={styles.cardFav}
            >
              <Ionicons
                name={favoriteIds.includes(item.id) ? "star" : "star-outline"}
                size={24}
                color={favoriteIds.includes(item.id) ? "#FFD700" : colors.icon}
              />
            </TouchableOpacity>
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
                handleAddToShoppingList();
              }}
            >
              <Ionicons name="add" size={20} color={colors.icon} />
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
              backgroundColor: colors.tertiary,
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              zIndex: 999,
              elevation: 10,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "bold" }}>
              Recette ajoutée à la liste de courses !
            </Text>
          </View>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Compare les propriétés importantes pour éviter les re-renders
    const isFavBefore = prevProps.favoriteIds.includes(prevProps.item.id);
    const isFavAfter = nextProps.favoriteIds.includes(nextProps.item.id);
    return (
      prevProps.item.id === nextProps.item.id &&
      isFavBefore === isFavAfter &&
      prevProps.listId === nextProps.listId &&
      prevProps.favoriteIds.length === nextProps.favoriteIds.length
    );
  }
);

const RecipeScreen: React.FC = () => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const api = Constants?.expoConfig?.extra?.API_URL || "";
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [types, setTypes] = useState<RecipeType[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<RecipeType | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [showShoppingListPicker, setShowShoppingListPicker] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  // Utilise les sélections du contexte au lieu du state local
  const {
    selectedFamily,
    setSelectedFamily,
    selectedShoppingList,
    setSelectedShoppingList,
  } = useUserData();

  // Memoized filtered recipes
  const filtered = React.useMemo(() => {
    return recipes
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
  }, [recipes, selectedType, search]);

  // Memoized callback for adding recipe to shopping list
  const handleAddToShoppingList = React.useCallback(
    async (recipeId: number, listId: number | null) => {
      if (!listId) {
        Alert.alert("Erreur", "Veuillez sélectionner une liste de courses");
        return;
      }
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          return;
        }
        const payload = {
          recipe_id: recipeId,
          shopping_list_id: listId,
        };
        const res = await fetch(`${api}shopping-lists/add-recipe/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorText = await res.text();
        } else {
          const responseData = await res.json();
        }
      } catch (e) {}
    },
    [api, selectedShoppingList, selectedFamily]
  );

  // Memoized callback for toggling favorite
  const handleFavoritePress = React.useCallback(
    async (recipeId: number) => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token || !selectedFamily) {
          Alert.alert("Erreur", "Veuillez sélectionner une famille");
          return;
        }

        const isFavorite = favoriteIds.includes(recipeId);
        const endpoint = isFavorite
          ? `${api}families/${selectedFamily.id}/remove-favorite/`
          : `${api}families/${selectedFamily.id}/add-favorite/`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipe_id: recipeId,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erreur ${res.status}: ${errorText}`);
        }

        // Met à jour le state local des favoris
        if (isFavorite) {
          setFavoriteIds((prev) => prev.filter((id) => id !== recipeId));
        } else {
          setFavoriteIds((prev) => [...prev, recipeId]);
        }
      } catch (e) {
        console.error("Error toggling favorite:", e);
        throw e;
      }
    },
    [api, selectedFamily, favoriteIds]
  );

  // Memoized fetch functions
  const fetchAllRecipes = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");

      // Récupère les favoris de la famille sélectionnée via le contexte
      let favoriteRecipeIds: number[] = [];
      if (selectedFamily) {
        try {
          const famRes = await fetch(`${api}families/${selectedFamily.id}/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          const famData = await famRes.json();
          const favoriteRecipes = famData.favorite_recipes || [];
          favoriteRecipeIds = favoriteRecipes.map((r: any) => r.id);
        } catch (e) {
          console.error("Erreur lors de la récupération des favoris:", e);
        }
      }
      setFavoriteIds(favoriteRecipeIds);

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
        .filter((r: any) => favoriteRecipeIds.includes(r.id))
        .map((r: any) => ({ ...r, is_favorite: true }));
      const otherRecipesList = allRecipes
        .filter((r: any) => !favoriteRecipeIds.includes(r.id))
        .map((r: any) => ({ ...r, is_favorite: false }));

      setRecipes([...favoriteRecipesList, ...otherRecipesList]);
    } catch (error) {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [api, selectedFamily]);

  const fetchTypes = React.useCallback(async () => {
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
  }, [api]);

  const fetchUserData = React.useCallback(async () => {
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
      // Données synchronisées via le contexte, pas besoin de les mettre dans le state local
    } catch (e) {
      // Erreurs gérées par le contexte
    } finally {
      setUserLoading(false);
    }
  }, [api]);

  // Utilise le contexte UserData
  const { families: contextFamilies, shoppingLists: contextShoppingLists } =
    useUserData();

  // Proper useFocusEffect with all dependencies
  useFocusEffect(
    React.useCallback(() => {
      fetchAllRecipes();
      fetchTypes();
    }, [fetchAllRecipes, fetchTypes])
  );

  // Synchronise l'état is_favorite des recettes avec favoriteIds
  useEffect(() => {
    setRecipes((prevRecipes) =>
      prevRecipes.map((recipe) => ({
        ...recipe,
        is_favorite: favoriteIds.includes(recipe.id),
      }))
    );
  }, [favoriteIds]);

  // Memoized key extractor for FlatList
  const keyExtractor = React.useCallback(
    (item: Recipe) => item.id.toString(),
    []
  );

  // Utilise les données du contexte memoïsées
  const families = React.useMemo(() => contextFamilies, [contextFamilies]);
  const shoppingLists = React.useMemo(
    () => contextShoppingLists,
    [contextShoppingLists]
  );

  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => (navigation as any).openDrawer()}
        >
          <Ionicons name="menu" size={28} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.homeTitle}>RECETTE</Text>
      </View>

      {/* Bloc famille et liste de courses */}
      <View style={[styles.infoBlocksRow, { marginTop: 40 }]}>
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
          <ActivityIndicator size="large" color={colors.action} />
        </View>
      ) : (
        <FlatList
          data={["create", ...filtered]}
          keyExtractor={(item) =>
            item === "create" ? "create" : (item as Recipe).id.toString()
          }
          numColumns={1}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) =>
            item === "create" ? (
              <TouchableOpacity
                style={[
                  styles.cardRow,
                  {
                    backgroundColor: colors.action,
                    marginBottom: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 8,
                    minHeight: 0,
                  },
                ]}
                onPress={() => router.push("/recipeForm?mode=create")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.icon}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "bold",
                    fontSize: 15,
                  }}
                >
                  Créer une nouvelle recette
                </Text>
              </TouchableOpacity>
            ) : (
              <RecipeCard
                item={item as Recipe}
                listId={selectedShoppingList?.id || null}
                familyId={selectedFamily?.id || null}
                favoriteIds={favoriteIds}
                onAddToList={handleAddToShoppingList}
                onFavoritePress={handleFavoritePress}
                colors={colors}
              />
            )
          }
        />
      )}

      {typeError && (
        <View
          style={{
            backgroundColor: colors.tertiary,
            padding: 12,
            margin: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "red", fontWeight: "bold" }}>
            Erreur chargement types : {typeError}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    typeTile: {
      backgroundColor: colors.tertiary,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginBottom: 4,
      alignItems: "center",
      minWidth: 48,
      borderWidth: 2,
      borderColor: colors.tertiary,
    },
    typeTileSelected: {
      backgroundColor: colors.action,
      borderColor: colors.action,
    },
    typeTileText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "bold",
      textAlign: "center",
    },
    typeTileTextSelected: {
      color: colors.text,
    },
    infoBlocksRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 12,
    },
    infoBlock: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 14,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.action,
    },
    infoBlockLabel: {
      color: colors.icon,
      fontSize: 13,
      marginBottom: 4,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    infoBlockValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "bold",
    },
    listNameInput: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "bold",
      backgroundColor: colors.secondary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginTop: 2,
      width: "100%",
      textAlign: "center",
      borderWidth: 2,
      borderColor: colors.tertiary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primary,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    loaderContainer: {
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
      backgroundColor: colors.secondary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 32,
      paddingBottom: 12,
      paddingHorizontal: 24,
      borderBottomWidth: 2,
      borderBottomColor: colors.tertiary,
    },
    menuButton: {
      padding: 4,
    },
    homeTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
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
      backgroundColor: colors.secondary,
      borderRadius: 8,
      flex: 1,
      height: 44,
      padding: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      height: 44,
    },
    typeButton: {
      backgroundColor: colors.secondary,
      borderRadius: 8,
      paddingHorizontal: 16,
      marginRight: 8,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.action,
    },
    typeButtonText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 15,
    },
    typePickerBlock: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    typePickerItem: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.tertiary,
    },
    typePickerText: {
      color: colors.text,
      fontSize: 15,
    },
    grid: { gap: 1 },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.secondary,
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
      backgroundColor: colors.tertiary,
      borderRadius: 10,
      padding: 12,
      margin: 6,
    },
    cardTitle: { fontSize: 16, fontWeight: "500", color: colors.text },
    cardSubtitle: { fontSize: 12, color: colors.text, marginTop: 8 },
    addButton: {
      position: "absolute",
      bottom: 24,
      right: 24,
      backgroundColor: colors.action,
      borderRadius: 30,
      padding: 16,
      elevation: 5,
    },

    addToListText: {
      color: colors.text,
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
      borderTopColor: colors.tertiary,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      marginBottom: 12,
    },
    pageButton: {
      flex: 1,
      backgroundColor: colors.action,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: "center",
      marginHorizontal: 4,
    },
    pageButtonText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 16,
    },
    pageInfo: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
    },

    addToListButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.action,
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
