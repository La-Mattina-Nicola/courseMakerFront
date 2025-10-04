import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Modal,
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

function RecipeScreen() {
  const api = process.env.EXPO_PUBLIC_API;
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
      console.log(data);
      setIngredientResults(data.results || []);
    } catch (e) {
      setIngredientResults([]);
    }
  };

  // Déplace la fonction fetchUserData en dehors du useEffect pour pouvoir la rappeler
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
        console.log("API response:", res.status, text);
        throw new Error("Réponse inattendue du serveur.");
      }
      if (!res.ok) {
        console.log("TEST", JSON.stringify(data, null, 2));
        throw new Error(
          "Erreur lors de la récupération des données utilisateur: " +
            JSON.stringify(data)
        );
      }
      setUserData(data);
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
  const [selectedShoppingList, setSelectedShoppingList] =
    React.useState<any>(null);
  const [showShoppingListPicker, setShowShoppingListPicker] =
    React.useState(false);
  // Ne pas écraser la sélection courante à chaque reload
  React.useEffect(() => {
    if (
      shoppingLists.length > 0 &&
      (!selectedShoppingList ||
        !shoppingLists.some((l: any) => l.id === selectedShoppingList.id))
    ) {
      setSelectedShoppingList(shoppingLists[0]);
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
        {/* Bloc famille */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Famille</Text>
          {families.length === 0 ? (
            <Text style={styles.familyMember}>Aucune famille</Text>
          ) : (
            families.map((fam: any) => (
              <View key={fam.id} style={styles.familyMembersList}>
                <Text style={styles.familyName}>{fam.name}</Text>
                <View style={styles.membersRow}>
                  {Array.isArray(fam.member_names) &&
                  fam.member_names.length > 0 ? (
                    fam.member_names.map((member: string) => (
                      <View key={member} style={styles.memberTile}>
                        <Text style={styles.memberTileText}>{member}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.familyMember}>Aucun membre</Text>
                  )}
                </View>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.familyButton}
            onPress={() =>
              router.push({
                pathname: "/family",
                params: {
                  family: JSON.stringify(families[0]),
                  user: JSON.stringify(userData?.user),
                },
              })
            }
          >
            <Text style={styles.familyButtonText}>Voir la famille</Text>
          </TouchableOpacity>
        </View>
        {/* Bloc liste de courses */}
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
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addIngredientButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={22} color="#fff" />
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
                  <Text style={styles.typePickerText}>{list.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.createListButton}
                onPress={() => {
                  alert("Créer une nouvelle liste de courses");
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  + Nouvelle liste
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Modal
            visible={showAddModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              // Retire d'abord l'ingrédient sélectionné (donc la ligne quantité/unité)
              setSelectedIngredient(null);
              setAddQty("");
              setAddUnit("");
              setShowAddModal(false);
              setIngredientResults([]);
              setSearchIngredient("");
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Ajouter un ingrédient</Text>
                <View style={styles.modalSearchRow}>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Rechercher un ingrédient..."
                    placeholderTextColor="#888"
                    value={searchIngredient}
                    onChangeText={setSearchIngredient}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.modalSendButton}
                    onPress={() => handleSearchIngredient(searchIngredient)}
                  >
                    <Ionicons name="send" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalResults}>
                  {selectedIngredient ? (
                    <View style={styles.addIngredientBlock}>
                      <View style={styles.addIngredientBlockRow}>
                        <TextInput
                          style={styles.qtyInput}
                          placeholder="Quantité"
                          placeholderTextColor="#888"
                          keyboardType="numeric"
                          value={addQty}
                          onChangeText={setAddQty}
                        />
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.unitPickerRow}
                        >
                          {units.map((unit) => (
                            <TouchableOpacity
                              key={unit}
                              style={[
                                styles.unitItem,
                                addUnit === unit && styles.unitItemSelected,
                              ]}
                              onPress={() => setAddUnit(unit)}
                            >
                              <Text
                                style={{
                                  color: addUnit === unit ? "#fff" : "#aaa",
                                }}
                              >
                                {unit}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <Text style={styles.selectedIngredientName}>
                          {selectedIngredient.name}
                        </Text>
                      </View>
                      <View style={styles.addIngredientBlockBtnsRow}>
                        <TouchableOpacity
                          style={styles.modalAddButton}
                          onPress={async () => {
                            if (
                              !shoppingLists.length ||
                              !selectedIngredient ||
                              !addQty ||
                              !addUnit
                            )
                              return;
                            setLoading(true);
                            try {
                              const token = await AsyncStorage.getItem(
                                "accessToken"
                              );
                              const listId = shoppingLists[0].id;
                              const res = await fetch(
                                `${api}shopping-lists/${listId}/add-item/`,
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: token
                                      ? `Bearer ${token}`
                                      : "",
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    ingredient_id: selectedIngredient.id,
                                    quantity: Number(addQty),
                                    unit: addUnit,
                                  }),
                                }
                              );
                              if (!res.ok) {
                                const text = await res.text();
                                throw new Error(
                                  "Erreur lors de l'ajout: " + text
                                );
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
                          }}
                          disabled={!addQty || !addUnit}
                        >
                          <Text style={{ color: "#fff", fontWeight: "bold" }}>
                            Ajouter
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.modalCloseButton}
                          onPress={() => {
                            // Retire d'abord l'ingrédient sélectionné (donc la ligne quantité/unité)
                            setSelectedIngredient(null);
                            setAddQty("");
                            setAddUnit("");
                            setShowAddModal(false);
                            setIngredientResults([]);
                            setSearchIngredient("");
                          }}
                        >
                          <Text style={{ color: "#fff" }}>Retour</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : ingredientResults.length === 0 && searchIngredient ? (
                    <Text
                      style={{
                        color: "#aaa",
                        textAlign: "center",
                        marginTop: 12,
                      }}
                    >
                      Aucun ingrédient trouvé
                    </Text>
                  ) : (
                    ingredientResults.map((ing) => (
                      <TouchableOpacity
                        key={ing.id}
                        style={styles.modalResultItem}
                        onPress={async () => {
                          setSelectedIngredient(ing);
                          setAddQty("");
                          setAddUnit("");
                          // Appel API pour récupérer les unités de l'ingrédient
                          try {
                            const res = await fetch(
                              `${api}ingredients/${ing.id}/units/`
                            );
                            if (res.ok) {
                              const data = await res.json();
                              if (
                                Array.isArray(data.units) &&
                                data.units.length > 0
                              ) {
                                setUnits(data.units);
                                setAddUnit(data.units[0]); // préremplit avec la première unité
                              } else {
                                setUnits([]);
                              }
                            } else {
                              setUnits([]);
                            }
                          } catch {
                            setUnits([]);
                          }
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 16 }}>
                          {ing.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            </View>
          </Modal>
        </View>
        <View style={styles.block}>
          {Object.entries(grouped).map(([type, items]) => (
            <View style={styles.blockTitle} key={type}>
              <CollapsibleCategory
                type={type}
                items={items}
                checkedItems={checkedItems}
                toggleChecked={toggleChecked}
              />
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async () => {
            if (!selectedShoppingList) return;
            try {
              setLoading(true);
              setError(null);
              const token = await AsyncStorage.getItem("accessToken");
              const listId = selectedShoppingList.id;
              // Appel API pour supprimer tous les items de la liste de courses sélectionnée
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
                throw new Error("Erreur lors de la suppression: " + text);
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
          <Text style={styles.deleteButtonText}>Supprimer tous les items</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function CollapsibleCategory({
  type,
  items,
  checkedItems,
  toggleChecked,
}: {
  type: string;
  items: Array<{ id: number; name: string; quantity: number; unit?: string }>;
  checkedItems: { [id: number]: boolean };
  toggleChecked: (id: number) => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
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
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        >
          <Text style={styles.ingredientType}>{type}</Text>
        </TouchableOpacity>
        <Text style={styles.collapseIcon}>{collapsed ? "▶" : "▼"}</Text>
      </View>
      {!collapsed && (
        <View style={styles.shoppingList}>
          {items.map((item) => (
            <ShoppingItem
              key={item.id}
              name={item.name}
              quantity={item.quantity}
              checked={!!checkedItems[item.id]}
              onPress={() => toggleChecked(item.id)}
              unit={item.unit}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ShoppingItem({
  name,
  quantity,
  checked,
  onPress,
  unit,
}: {
  name: string;
  quantity: number;
  checked: boolean;
  onPress: () => void;
  unit?: string;
}) {
  return (
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
        x{quantity} {unit ? unit : ""}{" "}
      </Text>
      <Text
        style={[
          styles.itemText,
          checked && { textDecorationLine: "line-through", color: "#888" },
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    borderBottomColor: "#333",
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  logoutIcon: {
    padding: 4,
  },
  block: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
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
    color: "#ECEDEE",
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
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },
  familyMembersList: {
    marginBottom: 12,
  },
  familyName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  familyMember: {
    fontSize: 14,
    color: "#fff",
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
    color: "#fff",
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
    borderBottomColor: "#333",
  },
  typePickerText: {
    color: "#fff",
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  itemBlock: {
    backgroundColor: Colors.dark.tertiary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  itemText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    marginBottom: 2,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  itemQty: {
    color: "#fff",
    fontSize: 15,
    marginRight: 12,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  collapseIcon: {
    fontSize: 18,
    color: "#9BA1A6",
    marginLeft: 8,
  },
  ingredientType: {
    color: "#9BA1A6",
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
    color: "#fff",
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
    borderColor: "#444",
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
  deleteButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 12,
  },
  deleteButtonText: {
    color: "#fff",
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
