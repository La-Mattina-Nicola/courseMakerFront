import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
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
import { Colors } from "../../constants/theme";

type Ingredient = {
  id: number;
  name: string;
  type?: IngredientType;
};

type IngredientType = {
  id: number;
  name: string;
};

type ApiResponse = {
  results: Ingredient[];
  count: number;
  next: string | null;
  previous: string | null;
};

const PAGE_SIZE = 10;

const IngredientScreen: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientTypes, setIngredientTypes] = useState<IngredientType[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<IngredientType | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const api = Constants.expoConfig?.extra?.API_URL ?? "";
  const router = useRouter();

  // Famille et liste de course
  const [userData, setUserData] = useState<any>(null);
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [selectedShoppingList, setSelectedShoppingList] = useState<any>(null);
  const [showShoppingListPicker, setShowShoppingListPicker] = useState(false);

  // Fetch user data (familles et listes)
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${api}user-data/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setUserData(data);
      setFamilies(data.families || []);
      setShoppingLists(data.shopping_lists || []);
      if (data.families?.length > 0) setSelectedFamily(data.families[0]);
      if (data.shopping_lists?.length > 0)
        setSelectedShoppingList(data.shopping_lists[0]);
    } catch {
      setUserData(null);
      setFamilies([]);
      setShoppingLists([]);
    }
  };

  // Fetch ingredient types (fetch all pages)
  const fetchIngredientTypes = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      let allTypes: IngredientType[] = [];
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

  // Fetch ingredients
  const fetchIngredients = async (pageNumber: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      let url = `${api}ingredients/?page=${pageNumber}`;
      if (selectedType) url += `&type=${selectedType.id}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const json: ApiResponse = await res.json();
      setIngredients(json.results);
      setTotal(json.count);
    } catch (error) {
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchIngredientTypes();
  }, []);

  useEffect(() => {
    fetchIngredients(page);
  }, [page, selectedType]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Recherche locale
  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add ingredient to selected shopping list using new POST endpoint
  async function addToShoppingList(
    ingredientId: number,
    quantity: number = 1,
    unitId?: number
  ) {
    if (!selectedShoppingList?.id || !ingredientId || !unitId) return;
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await fetch(`${api}api/shopping-list-items/`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopping_list: selectedShoppingList.id,
          ingredient: ingredientId,
          quantity,
          unit: unitId,
        }),
      });
      // Optionally show a success message or update UI
    } catch (error) {
      // Optionally handle error
    }
  }

  // For now, pick a default unitId (first from ingredientTypes if available)
  const defaultUnitId =
    ingredientTypes.length > 0 ? ingredientTypes[0].id : undefined;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header similaire à recipe.tsx */}
      <View style={styles.fixedHeader}>
        <Text style={styles.homeTitle}>INGRÉDIENTS</Text>
        <TouchableOpacity
          style={styles.logoutIcon}
          onPress={async () => {
            await AsyncStorage.removeItem("accessToken");
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
              <Text style={styles.typePickerText}>{list.name}</Text>
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
          />
        </View>
      </View>
      {showTypePicker && (
        <View style={styles.typePickerBlock}>
          {ingredientTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.typePickerItem}
              onPress={() => {
                setSelectedType(type);
                setShowTypePicker(false);
                setPage(1); // reset page on type change
              }}
            >
              <Text style={styles.typePickerText}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.dark.action} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          numColumns={1}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <IngredientCard
              item={item}
              onAdd={() => addToShoppingList(item.id, 1, defaultUnitId)}
            />
          )}
        />
      )}

      {/* Pagination */}
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, page === 1 && { opacity: 0.5 }]}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          <Text style={styles.pageButtonText}>Précédent</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>
          Page {page} / {totalPages}
        </Text>
        <TouchableOpacity
          style={[styles.pageButton, page === totalPages && { opacity: 0.5 }]}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
        >
          <Text style={styles.pageButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const IngredientCard: React.FC<{ item: Ingredient; onAdd: () => void }> = ({
  item,
  onAdd,
}) => (
  <View style={styles.cardRow}>
    <View style={styles.cardInfo}>
      <Text style={styles.cardTitle}>{item.name}</Text>
    </View>
    <TouchableOpacity style={styles.addToListButton} onPress={onAdd}>
      <Ionicons name="add" size={20} color="#fff" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
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
});

export default IngredientScreen;
