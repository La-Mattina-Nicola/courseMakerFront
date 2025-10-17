import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const PAGE_SIZE = 20;

const IngredientCard = ({
  item,
  onAdd,
  colors,
}: {
  item: any;
  onAdd: () => void;
  colors: any;
}) => {
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.cardRow}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
      </View>
      <TouchableOpacity style={styles.addToListButton} onPress={onAdd}>
        <Ionicons name="add" size={20} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
};

const IngredientScreen = () => {
  // Utilise le contexte UserData pour éviter les appels API répétés
  const {
    families: contextFamilies,
    shoppingLists: contextShoppingLists,
    refreshUserData: contextRefreshUserData,
  } = useUserData() || {};
  // Fonction de refreshUserData locale
  const refreshUserData = async () => {
    if (typeof contextRefreshUserData === "function") {
      await contextRefreshUserData();
    } else {
      // Fallback: refetch families and shopping lists from API
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const api = Constants?.expoConfig?.extra?.API_URL || "";
        const [familiesRes, shoppingListsRes] = await Promise.all([
          fetch(`${api}families/`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          }),
          fetch(`${api}shopping-lists/`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          }),
        ]);
        // Tu peux mettre à jour le state local ici si besoin
        // const familiesJson = await familiesRes.json();
        // const shoppingListsJson = await shoppingListsRes.json();
        // setFamilies(familiesJson.results || []);
        // setShoppingLists(shoppingListsJson.results || []);
      } catch (e) {}
    }
  };
  const navigation = useNavigation();

  // Fetch all ingredient types (all pages)
  const fetchIngredientTypes = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      let allTypes: any[] = [];
      let nextUrl: string | null = `${api}ingredient-types/`;
      while (nextUrl) {
        const res = await fetch(nextUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        const json: any = await res.json();
        allTypes = allTypes.concat(json.results || []);
        nextUrl = json.next;
      }
      setIngredientTypes(allTypes);
    } catch {
      setIngredientTypes([]);
    }
  };

  // Fetch all ingredients (all pages)
  const fetchAllIngredients = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      let allIngredients: any[] = [];
      let nextUrl: string | null = `${api}ingredients/`;
      while (nextUrl) {
        const res = await fetch(nextUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        const json: any = await res.json();
        allIngredients = allIngredients.concat(json.results || []);
        nextUrl = json.next;
      }
      setIngredients(allIngredients);
    } catch (error) {
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };
  // Recherche d'ingrédients par nom via l'API
  const searchIngredientsByName = async (name: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const url = `${api}ingredients/?search=${encodeURIComponent(name)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const json: any = await res.json();
      setIngredients(json.results || []);
    } catch (error) {
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const searchIngredientsByType = async (typeId: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const url = `${api}ingredients/?type=${typeId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const json: any = await res.json();
      setIngredients(json.results || []);
    } catch (error) {
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [showShoppingListPicker, setShowShoppingListPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [ingredientTypes, setIngredientTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const api = Constants?.expoConfig?.extra?.API_URL || "";

  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Utilise les données et sélections du contexte
  const families = contextFamilies;
  const shoppingLists = contextShoppingLists;
  const {
    selectedFamily,
    setSelectedFamily,
    selectedShoppingList,
    setSelectedShoppingList,
  } = useUserData() || {};

  // Resynchronise selectedShoppingList après chaque refreshUserData ou changement de shoppingLists
  React.useEffect(() => {
    if (!selectedShoppingList || !shoppingLists.length) return;
    const updated = shoppingLists.find(
      (l: any) => l.id === selectedShoppingList.id
    );
    if (updated && updated !== selectedShoppingList) {
      setSelectedShoppingList(updated);
    }
  }, [shoppingLists, selectedShoppingList?.id]);

  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    fetchIngredientTypes();
    fetchAllIngredients();
  }, []);

  // Recherche locale adaptée :
  const filtered = ingredients
    .filter((i) => {
      if (selectedType) {
        if (typeof i.type === "number") {
          return i.type === selectedType.id;
        } else if (typeof i.type === "object" && i.type?.id) {
          return i.type.id === selectedType.id;
        }
        return false;
      }
      return true;
    })
    .filter((i) => {
      const searchLower = search.toLowerCase();
      const nameMatch = i.name.toLowerCase().includes(searchLower);
      let typeMatch = false;
      if (typeof i.type === "object" && i.type?.name) {
        typeMatch = i.type.name.toLowerCase().includes(searchLower);
      }
      return nameMatch || typeMatch;
    });

  const addToShoppingList = async (
    ingredientId: number,
    quantity: number = 1,
    unitId: number = 1
  ) => {
    if (!ingredientId || !unitId) {
      return;
    }
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const url = `${api}shopping-list-items/`;

      // Build body conditionnel
      const body: any = {
        ingredient: ingredientId,
        quantity,
        unit: unitId,
      };
      if (selectedShoppingList && selectedShoppingList.id) {
        body.shopping_list = selectedShoppingList.id;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
      } else {
        setSuccessMessage(
          `${
            ingredients.find((i) => i.id === ingredientId)?.name ||
            "L'ingrédient"
          } a été ajouté à ${selectedShoppingList?.name || "la liste"}`
        );
        setShowSuccess(true);
        await refreshUserData();
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Success Modal */}
      {showSuccess && (
        <View
          style={{
            position: "absolute",
            bottom: 30,
            left: 20,
            right: 20,
            backgroundColor: "green",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            zIndex: 999,
            elevation: 10,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "bold" }}>
            {successMessage}
          </Text>
        </View>
      )}
      {/* Header similaire à recipe.tsx */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => (navigation as any).openDrawer()}
        >
          <Ionicons name="menu" size={28} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.homeTitle}>INGRÉDIENTS</Text>
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

      {/* Barre de recherche + bouton type */}
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
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => {
              if (search.trim()) {
                searchIngredientsByName(search.trim());
              }
            }}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="send" size={20} color={colors.action} />
          </TouchableOpacity>
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
                fetchAllIngredients();
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
            {ingredientTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeTile,
                  selectedType?.id === type.id && styles.typeTileSelected,
                ]}
                onPress={() => {
                  setSelectedType(type);
                  setShowTypePicker(false);
                  searchIngredientsByType(type.id);
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
            {ingredientTypes.map((type) => (
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

      {/* Liste des ingrédients */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.action} />
        </View>
      ) : (
        <FlatList
          data={["create", ...filtered]}
          keyExtractor={(item) =>
            item === "create" ? "create" : (item as any).id.toString()
          }
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
                onPress={() => {
                  router.push({
                    pathname: "/ingredientForm",
                    params: { search },
                  });
                }}
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
                  Créer un nouvel ingrédient
                </Text>
              </TouchableOpacity>
            ) : (
              <IngredientCard
                item={item as any}
                onAdd={() => addToShoppingList((item as any).id)}
                colors={colors}
              />
            )
          }
          contentContainerStyle={{ paddingTop: 12 }}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
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
    container: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
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
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      marginTop: 0,
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
    cardInfo: {
      flex: 1,
      minWidth: 0,
    },
    cardTitle: { fontSize: 16, fontWeight: "500", color: colors.text },
    cardSubtitle: { fontSize: 12, color: colors.icon, marginTop: 8 },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    pageButton: {
      backgroundColor: colors.action,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 18,
      marginHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    pageButtonText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 15,
    },
    pageInfo: { marginHorizontal: 12, fontSize: 16 },
    addToListButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.action,
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
      backgroundColor: colors.action,
      borderRadius: 30,
      padding: 16,
      elevation: 5,
    },
  });

export default IngredientScreen;
