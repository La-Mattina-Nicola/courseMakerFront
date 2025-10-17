import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import { useTheme } from "../../context/ThemeContext";
import { useUserData } from "../../context/UserDataContext";

const api = Constants.expoConfig?.extra?.API_URL ?? "";

// Hook personnalisé pour le debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function RecipeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [checkedItems, setCheckedItems] = React.useState<{
    [id: number]: boolean;
  }>({});

  // État pour les items supprimés de manière optimiste
  const [optimisticallyDeletedItems, setOptimisticallyDeletedItems] =
    React.useState<Set<number>>(new Set());

  // Modal ajout ingrédient
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [searchIngredient, setSearchIngredient] = React.useState("");
  const [ingredientResults, setIngredientResults] = React.useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = React.useState<any>(null);
  const [addQty, setAddQty] = React.useState<string>("");
  const [addUnit, setAddUnit] = React.useState<string>("");
  const [units, setUnits] = React.useState<string[]>([]);

  const [showFamilyPicker, setShowFamilyPicker] = React.useState(false);
  const [showShoppingListPicker, setShowShoppingListPicker] =
    React.useState(false);
  const [showCreateListModal, setShowCreateListModal] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");

  // État pour l'alerte personnalisée
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertTitle, setAlertTitle] = React.useState("");
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertOnConfirm, setAlertOnConfirm] = React.useState<() => void>(
    () => {}
  );

  // État pour les actions en cours (pour afficher un loader plus subtil)
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  // Debounce de la recherche d'ingrédients (500ms pour éviter trop d'appels)
  const debouncedSearchTerm = useDebounce(searchIngredient, 500);

  // Cache du token pour éviter de le lire à chaque fois
  const [cachedToken, setCachedToken] = React.useState<string | null>(null);

  // Charger le token une seule fois
  React.useEffect(() => {
    AsyncStorage.getItem("accessToken").then(setCachedToken);
  }, []);

  // Fonction optimisée de recherche d'ingrédient avec debouncing
  React.useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setIngredientResults([]);
      return;
    }

    const searchIngredients = async () => {
      try {
        const token =
          cachedToken || (await AsyncStorage.getItem("accessToken"));
        const res = await fetch(
          `${api}ingredients/?search=${encodeURIComponent(
            debouncedSearchTerm
          )}`,
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

    searchIngredients();
  }, [debouncedSearchTerm, cachedToken]);

  const setAddUnitToCart = async () => {
    if (!addQty || !selectedShoppingList) return;
    setIsActionLoading(true);
    try {
      const token = cachedToken || (await AsyncStorage.getItem("accessToken"));
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
          unit: 1,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error("Erreur lors de l'ajout: " + text);
      }

      // Refetch pour avoir les données à jour (contexte collaboratif)
      await refreshUserData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsActionLoading(false);
      setShowAddModal(false);
      setSelectedIngredient(null);
      setAddQty("");
      setAddUnit("");
      setIngredientResults([]);
      setSearchIngredient("");
    }
  };

  // Utilise le contexte UserData pour éviter les appels API répétés
  const {
    userData: contextUserData,
    families: contextFamilies,
    shoppingLists: contextShoppingLists,
    loading: contextLoading,
    error: contextError,
    refreshUserData,
    selectedFamily: contextSelectedFamily,
    setSelectedFamily: contextSetSelectedFamily,
    selectedShoppingList: contextSelectedShoppingList,
    setSelectedShoppingList: contextSetSelectedShoppingList,
  } = useUserData();
  const userData = contextUserData;
  const families = contextFamilies || [];
  const shoppingLists = contextShoppingLists || [];

  // Utilise les sélections du contexte au lieu du state local
  const selectedFamily = contextSelectedFamily;
  const setSelectedFamily = contextSetSelectedFamily;
  const selectedShoppingList = contextSelectedShoppingList;
  const setSelectedShoppingList = contextSetSelectedShoppingList;

  // Utilise l'erreur du contexte si elle existe, sinon l'erreur locale
  React.useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);

  // Synchronise le loading du contexte avec le state local
  React.useEffect(() => {
    setLoading(contextLoading);
  }, [contextLoading]);

  // Nettoyer optimisticallyDeletedItems quand la liste change (refresh naturel)
  React.useEffect(() => {
    if (selectedShoppingList) {
      // Vérifier quels items dans optimisticallyDeletedItems ne sont plus dans la liste
      const currentItemIds = new Set(
        selectedShoppingList.items?.map((item: any) => item.id) || []
      );

      setOptimisticallyDeletedItems((prev) => {
        const newSet = new Set<number>();
        prev.forEach((id) => {
          // Garder l'item dans le Set seulement s'il existe encore dans les données
          if (currentItemIds.has(id)) {
            newSet.add(id);
          }
        });
        return newSet;
      });
    }
  }, [selectedShoppingList]);

  // Resynchronise selectedShoppingList après chaque refreshUserData ou changement de shoppingLists
  React.useEffect(() => {
    if (!selectedShoppingList || !shoppingLists.length) return;
    const updated = shoppingLists.find((l) => l.id === selectedShoppingList.id);
    if (updated && updated !== selectedShoppingList) {
      setSelectedShoppingList(updated);
    }
  }, [shoppingLists, selectedShoppingList?.id]);

  useFocusEffect(
    React.useCallback(() => {
      // Rafraîchir les données à chaque fois que l'écran est focus
      refreshUserData();
    }, [refreshUserData])
  );

  function toggleChecked(id: number) {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Gestion optimisée de la création de liste
  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setIsActionLoading(true);
    try {
      const token = cachedToken || (await AsyncStorage.getItem("accessToken"));
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
        throw new Error("Erreur lors de la création: " + text);
      }

      setShowCreateListModal(false);
      setNewListName("");
      await refreshUserData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Gestion optimisée de la suppression de tous les items
  const handleClearAllItems = async () => {
    if (!selectedShoppingList) return;
    setIsActionLoading(true);
    try {
      const token = cachedToken || (await AsyncStorage.getItem("accessToken"));
      const listId = selectedShoppingList.id;
      const res = await fetch(`${api}shopping-lists/${listId}/clear-items/`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error("Erreur lors de la suppression: " + text);
      }

      await refreshUserData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Suppression de liste de courses avec confirmation
  const handleDeleteShoppingList = async (listId: number, listName: string) => {
    setAlertTitle("Supprimer la liste");
    setAlertMessage(`Êtes-vous sûr de vouloir supprimer "${listName}" ?`);
    setAlertOnConfirm(() => async () => {
      setAlertVisible(false);
      setIsActionLoading(true);
      try {
        const token =
          cachedToken || (await AsyncStorage.getItem("accessToken"));
        const res = await fetch(`${api}shopping-lists/${listId}/`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error("Erreur lors de la suppression: " + text);
        }

        await refreshUserData();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsActionLoading(false);
      }
    });
    setAlertVisible(true);
  };

  // Fonction pour gérer la suppression optimiste
  const handleOptimisticDelete = async (id: number) => {
    // Ajouter l'item à la liste des suppressions optimistes
    setOptimisticallyDeletedItems((prev) => new Set(prev).add(id));

    try {
      const token = cachedToken || (await AsyncStorage.getItem("accessToken"));
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

      // Suppression réussie - on garde l'item dans optimisticallyDeletedItems
      // Il sera automatiquement retiré lors du prochain refresh naturel des données
    } catch (e: any) {
      // En cas d'erreur, restaurer l'item
      setOptimisticallyDeletedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setError(e.message || "Erreur lors de la suppression.");
    }
  };

  // Regroupe et fusionne les items par type et nom d'ingrédient
  // Filtre les items supprimés de manière optimiste
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
          itemIds: number[]; // Garder trace des IDs pour savoir combien sont supprimés
        };
      };
    } = {};
    if (selectedShoppingList && Array.isArray(selectedShoppingList.items)) {
      selectedShoppingList.items.forEach((item: any) => {
        const type = item.ingredient_type || "Autre";
        const name = item.ingredient_name;
        if (!mergeMap[type]) mergeMap[type] = {};

        if (mergeMap[type][name]) {
          mergeMap[type][name].quantity += item.quantity;
          mergeMap[type][name].itemIds.push(item.id);
        } else {
          mergeMap[type][name] = {
            id: item.id,
            name,
            quantity: item.quantity,
            unit: item.unit,
            itemIds: [item.id],
          };
        }
      });
    }

    // Maintenant, on ajuste les quantités en fonction des items supprimés
    Object.entries(mergeMap).forEach(([type, itemsObj]) => {
      result[type] = Object.values(itemsObj)
        .map((mergedItem) => {
          // Compter combien d'items de ce groupe sont supprimés
          const deletedCount = mergedItem.itemIds.filter((id) =>
            optimisticallyDeletedItems.has(id)
          ).length;

          // Calculer la nouvelle quantité
          const adjustedQuantity = mergedItem.quantity - deletedCount;

          return {
            id: mergedItem.id,
            name: mergedItem.name,
            quantity: adjustedQuantity,
            unit: mergedItem.unit,
          };
        })
        .filter((item) => item.quantity > 0); // Ne garder que les items avec quantité > 0
    });

    return result;
  }, [selectedShoppingList, optimisticallyDeletedItems]);

  if (loading && !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fixedHeader}>
          <Text style={styles.homeTitle}>HOME</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.action} />
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
              backgroundColor: colors.action,
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 18,
            }}
            onPress={() => {
              setError(null);
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
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onCancel={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
        cancelText="Annuler"
        confirmText="Supprimer"
      />
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => (navigation as any).openDrawer()}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.homeTitle}>HOME</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 40, marginBottom: 30 }}
      >
        <CustomAlert
          visible={showCreateListModal}
          title="Créer une nouvelle liste"
          message="Entrez le nom de votre nouvelle liste"
          inputValue={newListName}
          onInputChange={setNewListName}
          inputPlaceholder="Nom de la liste"
          cancelText="Annuler"
          confirmText="Créer"
          confirmDisabled={!newListName.trim() || isActionLoading}
          onCancel={() => {
            setShowCreateListModal(false);
            setNewListName("");
          }}
          onConfirm={handleCreateList}
        />

        {/* Bloc famille avec sélection */}
        {!selectedFamily && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Famille</Text>
            {families.length > 0 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.listSelectorBlock,
                    { borderWidth: 2, borderColor: colors.action },
                  ]}
                  onPress={() => setShowFamilyPicker((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.blockTitle}>
                    {selectedFamily || "Sélectionner une famille"}
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
        )}

        {/* Bloc liste de courses */}
        {families.length > 0 && (
          <View style={styles.block}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                style={[styles.listSelectorBlock, { flex: 1 }]}
                onPress={() => setShowShoppingListPicker((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.blockName, { width: "100%" }]}>
                  <Text
                    style={[
                      styles.blockTitle,
                      { textAlign: "center" }, // centré le texte
                    ]}
                  >
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
                  <View
                    key={list.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.typePickerItem, { flex: 1 }]}
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
                    <TouchableOpacity
                      style={{ padding: 8 }}
                      onPress={() =>
                        handleDeleteShoppingList(list.id, list.name)
                      }
                    >
                      <Ionicons name="trash" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
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
                {Object.entries(grouped).length === 0 ? (
                  <View style={{ alignItems: "center", marginTop: 24 }}>
                    <Text style={{ color: colors.text, marginBottom: 12 }}>
                      Votre liste est vide.
                    </Text>
                  </View>
                ) : (
                  <View>
                    {Object.entries(grouped).map(
                      ([type, items]: [string, any]) => (
                        <View style={styles.blockTitle} key={type}>
                          <CollapsibleCategory
                            type={type}
                            items={items}
                            checkedItems={checkedItems}
                            toggleChecked={toggleChecked}
                            onDelete={handleOptimisticDelete}
                            optimisticallyDeletedItems={
                              optimisticallyDeletedItems
                            }
                          />
                        </View>
                      )
                    )}
                  </View>
                )}
              </View>
            )}
            {Object.entries(grouped).length > 0 && (
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.action,
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onPress={() => {
                    setAlertTitle("Vider la liste");
                    setAlertMessage(
                      "Êtes-vous sûr de vouloir supprimer tous les items de la liste ?"
                    );
                    setAlertOnConfirm(() => async () => {
                      setAlertVisible(false);
                      await handleClearAllItems();
                    });
                    setAlertVisible(true);
                  }}
                  disabled={isActionLoading}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}
                  >
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
  onDelete,
  optimisticallyDeletedItems,
}: {
  type: string;
  items: Array<{ id: number; name: string; quantity: number; unit?: string }>;
  checkedItems: { [id: number]: boolean };
  toggleChecked: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
  optimisticallyDeletedItems: Set<number>;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [collapsed, setCollapsed] = React.useState(false);

  // Filtrer les items supprimés de manière optimiste pour l'affichage
  const visibleItems = React.useMemo(() => {
    return items.filter((item) => !optimisticallyDeletedItems.has(item.id));
  }, [items, optimisticallyDeletedItems]);

  // Ne pas afficher la catégorie si tous les items sont supprimés
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 1 }}>
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
          {visibleItems.map((item) => (
            <ShoppingRow
              key={item.id}
              item={{ ...item, id: item.id.toString() }}
              checked={!!checkedItems[item.id]}
              onPress={() => toggleChecked(item.id)}
              onDelete={() => onDelete(item.id)}
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
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <CustomAlert
        visible={showDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        cancelText="Annuler"
        confirmText="Supprimer"
      />
      <View style={[styles.row, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={[styles.itemBlock, { flex: 1 }]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.itemQty,
              checked && {
                textDecorationLine: "line-through",
                color: colors.secondary,
              },
            ]}
          >
            x{item.quantity}{" "}
            {item.unit && item.unit !== "unit" ? item.unit : ""}
          </Text>
          <Text
            style={[
              styles.itemText,
              checked && {
                textDecorationLine: "line-through",
                color: colors.secondary,
              },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: 8,
          }}
        >
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteClick}
          >
            <MaterialIcons
              name="delete-outline"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 0,
      width: "100%",
    },
    editButton: {
      backgroundColor: "#4da6ff",
      padding: 8,
      borderRadius: 6,
      marginLeft: 6,
    },
    deleteButton: {
      backgroundColor: colors.action,
      padding: 3,
      borderRadius: 6,
      marginLeft: 6,
    },
    buttonText: {
      color: colors.text,
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
    logoutIcon: {
      padding: 4,
    },
    block: {
      backgroundColor: colors.secondary,
      width: "100%",
      borderRadius: 16,
      padding: 18,
      shadowColor: colors.primary,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    blockName: {
      width: "100%",
      borderColor: colors.action,
      borderWidth: 2,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    blockTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    familyButton: {
      backgroundColor: colors.action,
      width: "100%",
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
      alignSelf: "flex-start",
      marginTop: 8,
    },
    familyButtonText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 15,
      textAlign: "center",
    },
    familyMembersList: {
      marginBottom: 12,
    },
    familyName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    familyMember: {
      fontSize: 14,
      color: colors.text,
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
      backgroundColor: colors.tertiary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 8,
      marginRight: 8,
      alignItems: "center",
      minWidth: 48,
    },
    memberTileText: {
      color: colors.text,
      fontSize: 15,
      textAlign: "center",
      fontWeight: "bold",
    },
    addIngredientButton: {
      backgroundColor: colors.action,
      borderRadius: 8,
      padding: 8,
      marginLeft: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    listSelectorBlock: {
      backgroundColor: colors.secondary,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 18,
      marginRight: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    typePickerBlock: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      marginTop: 4,
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
    createListButton: {
      backgroundColor: colors.action,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    categoryBox: {
      backgroundColor: colors.secondary,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.action,
      padding: 12,
      marginBottom: 18,
      shadowColor: colors.primary,
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    itemBlock: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 5,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    itemText: {
      color: colors.text,
      fontSize: 16,
      flex: 1,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    itemQty: {
      color: colors.text,
      fontSize: 15,
      marginRight: 12,
      fontWeight: "bold",
    },
    collapseIcon: {
      fontSize: 18,
      color: colors.icon,
      marginLeft: 8,
    },
    ingredientType: {
      color: colors.icon,
      fontSize: 15,
      fontWeight: "bold",
      marginLeft: 2,
    },
    modalTitle: {
      color: colors.text,
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
      backgroundColor: colors.tertiary,
      color: colors.text,
      fontSize: 16,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 2,
      borderColor: colors.action,
      flex: 1,
      marginRight: 8,
    },
    modalSendButton: {
      backgroundColor: colors.action,
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
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 24,
      width: "90%",
      maxWidth: 400,
      alignItems: "center",
    },
    modalResultItem: {
      backgroundColor: colors.tertiary,
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
      color: colors.text,
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
      backgroundColor: colors.tertiary,
      color: colors.text,
      fontSize: 16,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 2,
      borderColor: colors.action,
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
      backgroundColor: colors.secondary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 4,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.tertiary,
    },
    unitItemSelected: {
      backgroundColor: colors.action,
      borderColor: colors.action,
    },
    modalAddButton: {
      backgroundColor: colors.action,
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
      backgroundColor: colors.action,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 24,
      marginTop: 8,
    },
    deleteButtonText: {
      color: colors.text,
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
