import { getAccessToken } from "@/utils/auth";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Colors } from "../constants/theme";

export default function FamilyScreen() {
  const [showCreateFamilyModal, setShowCreateFamilyModal] =
    React.useState(false);
  const [newFamilyNameModal, setNewFamilyNameModal] = React.useState("");
  const [creatingFamilyModal, setCreatingFamilyModal] = React.useState(false);
  const [createFamilyError, setCreateFamilyError] = React.useState<
    string | null
  >(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  let families = [];
  interface Family {
    id: number;
    name: string;
    member_names: string[];
  }

  interface User {
    id: number;
    username: string;
    email: string;
    [key: string]: any;
  }

  let user: User | null = null;
  try {
    if (params.family)
      families = Array.isArray(JSON.parse(params.family as string))
        ? JSON.parse(params.family as string)
        : [JSON.parse(params.family as string)];
    if (params.user) user = JSON.parse(params.user as string);
  } catch {}

  // Sélection famille (comme dans home)
  const [selectedFamily, setSelectedFamily] = React.useState<any>(
    families.length > 0 ? families[0] : null
  );
  const [showFamilyPicker, setShowFamilyPicker] = React.useState(false);

  React.useEffect(() => {
    if (
      families.length > 0 &&
      (!selectedFamily ||
        !families.find((f: any) => f.id === selectedFamily.id))
    ) {
      setSelectedFamily(families[0]);
    }
  }, [families]);

  // Pour affichage principal
  const hasFamily = selectedFamily && selectedFamily.name;
  const familyName = hasFamily ? selectedFamily.name : null;
  const members =
    hasFamily && Array.isArray(selectedFamily.member_names)
      ? selectedFamily.member_names
      : [];

  const [search, setSearch] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [newFamilyName, setNewFamilyName] = React.useState("");
  const [creatingFamily, setCreatingFamily] = React.useState(false);

  function addUserToFamily(user: any) {
    return async () => {
      // Appel API pour ajouter l'utilisateur à la famille
      try {
        const api = Constants?.expoConfig?.extra?.API_URL || "";
        const token = await getAccessToken();

        // Utilise l'id de la famille sélectionnée, pas un id en dur !
        const familyId = selectedFamily?.id;
        if (!familyId) {
          alert("Aucune famille sélectionnée.");
          return;
        }

        const url = `${api}families/${familyId}/add-members/`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ user_ids: [user.id] }),
        });

        let text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          // Probablement une réponse HTML (erreur serveur)
          alert(
            "Erreur inattendue du serveur.\n" +
              "Code HTTP: " +
              res.status +
              "\n" +
              text
          );
          return;
        }

        if (!res.ok) {
          alert("Erreur: " + JSON.stringify(data));
        } else {
          alert("Utilisateur ajouté à la famille !");
          // Re-fetch user data après ajout
          const userRes = await fetch(`${api}user-data/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          const userData = await userRes.json();
          router.replace({
            pathname: "/family",
            params: {
              family: JSON.stringify(userData.families),
              user: JSON.stringify(userData.user),
            },
          });
        }
      } catch (e) {
        alert("Erreur lors de l'ajout à la famille");
      }
    };
  }

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const api = Constants?.expoConfig?.extra?.API_URL || "";
      const token = await getAccessToken();
      const res = await fetch(
        `${api}user-search/?username=${encodeURIComponent(search)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setResults([]);
        throw new Error(data.detail || "Erreur lors de la recherche");
      }
      // Si la réponse est un objet unique, le mettre dans un tableau
      if (data && !Array.isArray(data.results) && data.id) {
        setResults([data]);
      } else {
        setResults(data.results || []);
      }
    } catch (e: any) {
      setError(e.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleCreateFamily() {
    if (!newFamilyName.trim()) return;
    setCreatingFamily(true);
    try {
      const api = Constants?.expoConfig?.extra?.API_URL || "";
      const token = await getAccessToken();
      // Ajoute un body avec un tableau vide pour "members"
      if (!user) {
        throw new Error("Utilisateur non défini.");
      }
      const res = await fetch(`${api}families/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ name: newFamilyName, members: [user.id] }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.detail || JSON.stringify(data) || "Erreur lors de la création"
        );
      // Re-fetch user data après création
      const userRes = await fetch(`${api}user-data/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const userData = await userRes.json();
      router.replace({
        pathname: "/family",
        params: {
          family: JSON.stringify(userData.families),
          user: JSON.stringify(userData.user),
        },
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreatingFamily(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.logoutIcon}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.homeTitle}>FAMILY {familyName}</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ alignItems: "center", paddingTop: 72 }}
      >
        <View style={styles.familyBlock}>
          <TouchableOpacity
            style={styles.createFamilyButton}
            onPress={() => setShowCreateFamilyModal(true)}
          >
            <Text style={styles.createFamilyButtonText}>
              + Nouvelle famille
            </Text>
          </TouchableOpacity>

          {/* Modal création famille */}
          <Modal
            visible={showCreateFamilyModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              setShowCreateFamilyModal(false);
              setNewFamilyNameModal("");
              setCreateFamilyError(null);
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "flex-start",
                alignItems: "center",
                paddingTop: 100, // Décale la modale vers le haut
              }}
            >
              <View style={[styles.familyBlock]}>
                <Text style={styles.familyTitle}>
                  Créer une nouvelle famille
                </Text>
                <View style={styles.searchUserRow}>
                  <TextInput
                    style={styles.searchUserInput}
                    placeholder="Nom de la famille"
                    placeholderTextColor="#888"
                    value={newFamilyName}
                    onChangeText={setNewFamilyName}
                    autoFocus
                  />
                </View>
                {createFamilyError && (
                  <Text style={{ color: "#b00", marginVertical: 8 }}>
                    {createFamilyError}
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <TouchableOpacity
                    style={styles.createFamilyButton}
                    disabled={creatingFamilyModal || !newFamilyName.trim()}
                    onPress={async () => {
                      if (!newFamilyName.trim()) return;
                      setCreatingFamilyModal(true);
                      try {
                        const api = Constants?.expoConfig?.extra?.API_URL || "";
                        const token = await getAccessToken();
                        if (!user) {
                          throw new Error("Utilisateur non défini.");
                        }
                        const res = await fetch(`${api}families/`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: token ? `Bearer ${token}` : "",
                          },
                          body: JSON.stringify({
                            name: newFamilyName,
                            members: [user.id],
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok)
                          throw new Error(
                            data.detail ||
                              JSON.stringify(data) ||
                              "Erreur lors de la création"
                          );
                        // Re-fetch user data après création
                        const userRes = await fetch(`${api}user-data/`, {
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: token ? `Bearer ${token}` : "",
                          },
                        });
                        const userData = await userRes.json();
                        // Sélectionne la famille qui vient d'être créée
                        let newFamily = null;
                        if (
                          userData.families &&
                          Array.isArray(userData.families)
                        ) {
                          newFamily = userData.families.find(
                            (f: any) => f.id === data.id
                          );
                        }
                        setShowCreateFamilyModal(false);
                        setNewFamilyNameModal("");
                        setCreateFamilyError(null);
                        setNewFamilyName("");
                        setResults([]);
                        setSearch("");
                        setSelectedFamily(
                          newFamily ||
                            (userData.families && userData.families[0]) ||
                            null
                        );
                        router.replace({
                          pathname: "/family",
                          params: {
                            family: JSON.stringify(userData.families),
                            user: JSON.stringify(userData.user),
                          },
                        });
                      } catch (e: any) {
                        setCreateFamilyError(e.message);
                      } finally {
                        setCreatingFamilyModal(false);
                      }
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {creatingFamilyModal ? "Création..." : "Créer"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.createFamilyButton}
                    onPress={() => {
                      setShowCreateFamilyModal(false);
                      setNewFamilyNameModal("");
                      setCreateFamilyError(null);
                    }}
                  >
                    <Text style={{ color: "#fff" }}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {selectedFamily && (
            <>
              <Text style={styles.familyTitle}>Famille</Text>
              {familyName ? (
                <Text style={styles.familyName}>{familyName}</Text>
              ) : (
                <Text style={styles.familyName}>Aucune famille</Text>
              )}

              <Text style={styles.membersTitle}>Membres :</Text>
              <View style={styles.membersList}>
                {members.length > 0 ? (
                  members.map((m: any) => (
                    <Text key={m} style={styles.member}>
                      {m}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.member}>Aucun membre</Text>
                )}
              </View>
              {/* Champ de recherche utilisateur */}
              <View style={styles.searchUserRow}>
                <TextInput
                  style={styles.searchUserInput}
                  placeholder="Rechercher utilisateur"
                  placeholderTextColor="#888"
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity
                  style={styles.searchUserButton}
                  onPress={handleSearch}
                >
                  <MaterialIcons
                    name="send"
                    size={18}
                    color={Colors.dark.text}
                  />
                </TouchableOpacity>
              </View>
              {searching && (
                <ActivityIndicator color="orangered" style={{ marginTop: 8 }} />
              )}
              {error && (
                <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>
              )}
              {results.length > 0 && (
                <View style={styles.searchResultsBlock}>
                  {results.map((user) => (
                    <View
                      key={user.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchResultText}>
                          {user.username} ({user.email})
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addUserButton}
                        onPress={addUserToFamily(user)}
                      >
                        <Text style={styles.addUserButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  homeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  logoutIcon: {
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
    paddingLeft: 24,
    paddingRight: 24,
    justifyContent: "flex-start",
  },
  familyBlock: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 75,
    width: "90%",
    maxWidth: "100%",
    justifyContent: "center",
  },
  familyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 6,
  },
  familyName: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  membersTitle: {
    fontSize: 15,
    color: Colors.dark.icon,
    marginBottom: 8,
    marginLeft: 2,
  },
  membersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  member: {
    fontSize: 15,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.tertiary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 20,
    textAlign: "center",
    minWidth: 48,
  },
  searchUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  searchUserInput: {
    flex: 1,
    backgroundColor: Colors.dark.tertiary,
    color: Colors.dark.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 8,
  },
  searchUserButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  searchUserButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 15,
  },
  searchResultsBlock: {
    marginTop: 8,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 8,
    padding: 8,
  },
  searchResultText: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 4,
  },
  addUserButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addUserButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  createFamilyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  createFamilyInput: {
    flex: 1,
    backgroundColor: Colors.dark.tertiary,
    color: Colors.dark.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 50,
  },
  createFamilyButton: {
    backgroundColor: Colors.dark.action,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createFamilyButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 15,
  },
});
