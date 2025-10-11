import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GestureRecognizer from "react-native-swipe-gestures";
import { Colors } from "../../constants/theme";
import { removeTokens } from "../../utils/auth";

const api = Constants.expoConfig?.extra?.API_URL ?? "";

function RecipeScreen() {
  const router = useRouter();

  // Ajoute l'état pour les données utilisateur
  const [userData, setUserData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Ajoute l'état checked pour chaque item
  const [checkedItems, setCheckedItems] = React.useState<{
    [id: number]: boolean;
  }>({});

  // Modal ajout ingrédient
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [searchIngredient, setSearchIngredient] = React.useState("");
  const [ingredientResults, setIngredientResults] = React.useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = React.useState<any>(null);
  const [addQty, setAddQty] = React.useState<string>("");
  const [addUnit, setAddUnit] = React.useState<string>("");
  const [units, setUnits] = React.useState<string[]>([]);

  const [swipeDirection, setSwipeDirection] = React.useState<string | null>(
    null
  );
  // Fonction de recherche d'ingrédient (API à adapter)
  const handleSearchIngredient = async (query: string) => {
    setSearchIngredient(query);
    if (!query.trim()) {
      setIngredientResults([]);
      return;
    }
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(
        `${api}ingredients/?search=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      setIngredientResults(data.results || []);
    } catch (e) {
      setIngredientResults([]);
    }
  };

  const setAddUnitToCart = async () => {
    if (!addQty) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${api}shopping-list-items/`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopping_list: selectedShoppingList.id,
          ingredient: selectedIngredient.id,
          quantity: Number(addQty),
          unit: 1, // id de l'unité
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error("Erreur lors de l'ajout: " + text);
      }
      await fetchUserData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setShowAddModal(false);
      setSelectedIngredient(null);
      setAddQty("");
      setAddUnit("");
      setIngredientResults([]);
      setSearchIngredient("");
    }
  };

  const fetchUserData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${api}user-data/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Réponse inattendue du serveur.");
      }
      if (!res.ok) {
        throw new Error(
          "Erreur lors de la récupération des données utilisateur: " +
            JSON.stringify(data)
        );
      }
      setUserData(data);
      if (!data.families || data.families.length === 0) {
        setSelectedFamily(null);
      } else if (!selectedFamily) {
        setSelectedFamily(data.families[0]);
      }
      // Synchronise la sélection si la liste existe toujours
      if (selectedShoppingList) {
        const updatedList = data.shopping_lists.find(
          (l: any) => l.id === selectedShoppingList.id
        );
        if (updatedList) {
          setSelectedShoppingList(updatedList);
        }
        // Si la liste sélectionnée n'existe plus, sélectionne la dernière liste
        else if (data.shopping_lists.length > 0) {
          setSelectedShoppingList(
            data.shopping_lists[data.shopping_lists.length - 1]
          );
        } else {
          setSelectedShoppingList(null);
        }
      }
      // Si aucune liste n'est sélectionnée, sélectionne la dernière par défaut
      else if (data.shopping_lists.length > 0) {
        setSelectedShoppingList(
          data.shopping_lists[data.shopping_lists.length - 1]
        );
      } else {
        setSelectedShoppingList(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Refetch les données utilisateur à chaque fois que la page devient active
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  // Fonction pour toggle l'état barré d'un item
  function toggleChecked(id: number) {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Prépare les données pour l'affichage
  const families = userData?.families || [];
  const shoppingLists = userData?.shopping_lists || [];
  const [selectedFamily, setSelectedFamily] = React.useState<any>(null);
  const [showFamilyPicker, setShowFamilyPicker] = React.useState(false);
  const [selectedShoppingList, setSelectedShoppingList] =
    React.useState<any>(null);
  const [showShoppingListPicker, setShowShoppingListPicker] =
    React.useState(false);

  // Ajoutez cet état en haut du composant RecipeScreen :
  const [showCreateListModal, setShowCreateListModal] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  // Ne pas écraser la sélection courante à chaque reload
  React.useEffect(() => {
    if (userData) {
      // Shopping list
      if (selectedShoppingList && userData.shopping_lists?.length > 0) {
        const updatedList = userData.shopping_lists.find(
          (l: any) => l.id === selectedShoppingList.id
        );
        if (updatedList) setSelectedShoppingList(updatedList);
      }
      // Famille
      if (selectedFamily && userData.families?.length > 0) {
        const updatedFam = userData.families.find(
          (f: any) => f.id === selectedFamily.id
        );
        if (updatedFam) setSelectedFamily(updatedFam);
      }
      // Sélectionne la première famille par défaut si aucune sélection
      if (!selectedFamily && userData.families?.length > 0) {
        setSelectedFamily(userData.families[0]);
      }
    }
  }, [userData]);
  // Regroupe et fusionne les items par type et nom d'ingrédient
  const grouped = React.useMemo(() => {
    const result: {
      [type: string]: Array<{
        id: number;
        name: string;
        quantity: number;
        unit?: string;
      }>;
    } = {};
    const mergeMap: {
      [type: string]: {
        [name: string]: {
          id: number;
          name: string;
          quantity: number;
          unit?: string;
        };
      };
    } = {};
    if (selectedShoppingList && Array.isArray(selectedShoppingList.items)) {
      selectedShoppingList.items.forEach((item: any) => {
        const type = item.ingredient_type || "Autre";
        const name = item.ingredient_name;
        if (!mergeMap[type]) mergeMap[type] = {};
        if (mergeMap[type][name]) {
          // Additionne la quantité si l'ingrédient existe déjà
          mergeMap[type][name].quantity += item.quantity;
        } else {
          mergeMap[type][name] = {
            id: item.id,
            name,
            quantity: item.quantity,
            unit: item.unit,
          };
        }
      });
    }
    // Transforme mergeMap en tableau pour chaque type
    Object.entries(mergeMap).forEach(([type, itemsObj]) => {
      result[type] = Object.values(itemsObj);
    });
    return result;
  }, [selectedShoppingList]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fixedHeader}>
          <Text style={styles.homeTitle}>HOME</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.dark.action} />
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fixedHeader}>
          <Text style={styles.homeTitle}>HOME</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "red", marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.dark.action,
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 18,
            }}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Relance la requête
              fetchUserData();
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <Text style={styles.homeTitle}>HOME</Text>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 72 }}
      >
        {showCreateListModal && (
          <>
            <View
              style={[
                styles.modalOverlay,
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 500,
                  zIndex: 100,
                },
              ]}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Créer une nouvelle liste</Text>
                <TextInput
                  style={[
                    styles.modalSearchInput,
                    {
                      minWidth: 220,
                      fontSize: 18,
                      paddingVertical: 12,
                      paddingHorizontal: 18,
                      minHeight: 50,
                    },
                  ]}
                  placeholder="Nom de la liste"
                  placeholderTextColor="#888"
                  value={newListName}
                  onChangeText={setNewListName}
                  autoFocus
                />
                <View style={styles.addIngredientBlockBtnsRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalAddButton,
                      { opacity: newListName.trim() ? 1 : 0.5 },
                    ]}
                    disabled={!newListName.trim()}
                    onPress={async () => {
                      if (!newListName.trim()) return;
                      setLoading(true);
                      try {
                        const token = await AsyncStorage.getItem("accessToken");
                        const res = await fetch(`${api}shopping-lists/`, {
                          method: "POST",
                          headers: {
                            Authorization: token ? `Bearer ${token}` : "",
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            name: newListName,
                            family: selectedFamily?.id,
                          }),
                        });
                        if (!res.ok) {
                          const text = await res.text();
                          throw new Error(
                            "Erreur lors de la création: " + text
                          );
                        }
                        setShowCreateListModal(false);
                        setNewListName("");
                        await fetchUserData();
                      } catch (e: any) {
                        setError(e.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Créer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowCreateListModal(false);
                      setNewListName("");
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
        {/* Bloc famille avec sélection */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Famille</Text>
          {families.length > 0 && (
            <>
              <TouchableOpacity
                style={[
                  styles.listSelectorBlock,
                  { borderWidth: 2, borderColor: Colors.dark.action },
                ]}
                onPress={() => setShowFamilyPicker((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.blockTitle}>
                  {selectedFamily?.name || "Sélectionner une famille"}
                </Text>
              </TouchableOpacity>
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
            </>
          )}
          <TouchableOpacity
            style={styles.familyButton}
            onPress={() =>
              router.push({
                pathname: "/family",
                params: {
                  family: JSON.stringify(selectedFamily || families[0]),
                  user: JSON.stringify(userData?.user),
                },
              })
            }
          >
            <Text style={styles.familyButtonText}>Voir la famille</Text>
          </TouchableOpacity>
        </View>

        {/* Bloc liste de courses */}

        {families.length > 0 && (
          <View style={styles.block}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={styles.listSelectorBlock}
                onPress={() => setShowShoppingListPicker((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={styles.blockName}>
                  <Text style={styles.blockTitle}>
                    {selectedShoppingList?.name || "Liste des courses"}
                    {selectedShoppingList?.family && families.length > 0
                      ? (() => {
                          const fam = families.find(
                            (f: any) => f.id === selectedShoppingList.family
                          );
                          return fam ? ` (${fam.name})` : "";
                        })()
                      : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
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
                      {list.family && families.length > 0
                        ? (() => {
                            const fam = families.find(
                              (f: any) => f.id === list.family
                            );
                            return fam ? ` (${fam.name})` : "";
                          })()
                        : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.createListButton}
                  onPress={() => {
                    setShowCreateListModal(true);
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    + Nouvelle liste
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {shoppingLists.length > 0 && (
              <View>
                {Object.entries(grouped).map(([type, items]) => (
                  <View style={styles.blockTitle} key={type}>
                    <CollapsibleCategory
                      type={type}
                      items={items}
                      checkedItems={checkedItems}
                      toggleChecked={toggleChecked}
                      fetchUserData={fetchUserData}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={async () => {
                    if (!selectedShoppingList) return;
                    try {
                      setLoading(true);
                      setError(null);
                      const token = await AsyncStorage.getItem("accessToken");
                      const listId = selectedShoppingList.id;
                      const res = await fetch(
                        `${api}shopping-lists/${listId}/clear-items/`,
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: token ? `Bearer ${token}` : "",
                          },
                        }
                      );
                      if (!res.ok) {
                        const text = await res.text();
                        throw new Error(
                          "Erreur lors de la suppression: " + text
                        );
                      }
                      // Refetch les données après suppression
                      await fetchUserData();
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Text style={styles.deleteButtonText}>
                    Supprimer tous les items
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CollapsibleCategory({
  type,
  items,
  checkedItems,
  toggleChecked,
  fetchUserData,
}: {
  type: string;
  items: Array<{ id: number; name: string; quantity: number; unit?: string }>;
  checkedItems: { [id: number]: boolean };
  toggleChecked: (id: number) => void;
  fetchUserData: () => Promise<void>;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  function handleDelete(id: number): void {
    // Suppression d'un item de la liste de courses via l'API
    (async () => {
      try {
        // On suppose que l'API et fetchUserData sont accessibles via closure
        const token = await AsyncStorage.getItem("accessToken");
        const res = await fetch(`${api}shopping-list-items/${id}/`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error("Erreur lors de la suppression: " + text);
        }
        // Rafraîchir les données utilisateur après suppression
        await fetchUserData();
      } catch (e: any) {
        alert(e.message || "Erreur lors de la suppression.");
      }
    })();
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => setCollapsed((c) => !c)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.ingredientType}>{type}</Text>
          <Text style={styles.collapseIcon}>{collapsed ? "▶" : "▼"}</Text>
        </TouchableOpacity>
      </View>
      {!collapsed && (
        <View style={styles.shoppingList}>
          {items.map((item) => (
            <ShoppingRow
              key={item.id}
              item={{ ...item, id: item.id.toString() }}
              checked={!!checkedItems[item.id]}
              onPress={() => toggleChecked(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ShoppingRow({
  item,
  checked,
  onPress,
  onDelete,
}: {
  item: { id: string; name: string; quantity: number; unit?: string };
  checked: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const [swipeDirection, setSwipeDirection] = React.useState<string | null>(
    null
  );

  return (
    <GestureRecognizer
      onSwipeLeft={() => setSwipeDirection("left")}
      onSwipeUp={() => setSwipeDirection(null)}
      onSwipeDown={() => setSwipeDirection(null)}
    >
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.itemBlock}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.itemQty,
              checked && { textDecorationLine: "line-through", color: "#888" },
            ]}
          >
            x{item.quantity} {item.unit ?? ""}
          </Text>
          <Text
            style={[
              styles.itemText,
              checked && { textDecorationLine: "line-through", color: "#888" },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { opacity: swipeDirection === "left" ? 1 : 0 },
            ]}
            onPress={onDelete}
            disabled={swipeDirection !== "left"}
          >
            <MaterialIcons name="delete-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </GestureRecognizer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  editButton: {
    backgroundColor: "#4da6ff",
    padding: 8,
    borderRadius: 6,
    marginLeft: 6,
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 6,
    marginLeft: 6,
  },
  buttonText: {
    color: "#fff",
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
  block: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  blockName: {
    borderColor: Colors.dark.action,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  familyButton: {
    backgroundColor: Colors.dark.action,
    width: "100%",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  familyButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },
  familyMembersList: {
    marginBottom: 12,
  },
  familyName: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  familyMember: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  shoppingList: {
    marginTop: 12,
  },
  membersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 8,
  },
  memberTile: {
    backgroundColor: Colors.dark.tertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    marginRight: 8,
    alignItems: "center",
    minWidth: 48,
  },
  memberTileText: {
    color: Colors.dark.text,
    fontSize: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  addIngredientButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  listSelectorBlock: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  typePickerBlock: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginTop: 4,
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
  createListButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  categoryBox: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.dark.action,
    padding: 12,
    marginBottom: 18,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  itemBlock: {
    backgroundColor: Colors.dark.tertiary,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
  },
  itemText: {
    color: Colors.dark.text,
    fontSize: 16,
    flex: 1,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  itemQty: {
    color: Colors.dark.text,
    fontSize: 15,
    marginRight: 12,
    fontWeight: "bold",
  },
  collapseIcon: {
    fontSize: 18,
    color: Colors.dark.icon,
    marginLeft: 8,
  },
  ingredientType: {
    color: Colors.dark.icon,
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 2,
  },
  modalTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    gap: 8,
    justifyContent: "center",
  },
  modalSearchInput: {
    backgroundColor: Colors.dark.tertiary,
    color: Colors.dark.text,
    fontSize: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Colors.dark.action,
    flex: 1,
    marginRight: 8,
  },
  modalSendButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalResults: {
    width: "100%",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalResultItem: {
    backgroundColor: Colors.dark.tertiary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  addIngredientBlock: {
    alignItems: "center",
    width: "100%",
  },
  addIngredientBlockRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
    marginBottom: 8,
    justifyContent: "center",
  },
  selectedIngredientName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
    maxWidth: 120,
    overflow: "hidden",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
    width: "100%",
    justifyContent: "center",
  },
  qtyInput: {
    backgroundColor: Colors.dark.tertiary,
    color: Colors.dark.text,
    fontSize: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Colors.dark.action,
    width: 90,
    textAlign: "center",
    marginRight: 8,
  },
  unitPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  unitPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unitItem: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.dark.tertiary,
  },
  unitItemSelected: {
    backgroundColor: Colors.dark.action,
    borderColor: Colors.dark.action,
  },
  modalAddButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    opacity: 1,
  },
  modalCloseButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  deleteButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  addIngredientBlockBtnsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
});

export default RecipeScreen;
