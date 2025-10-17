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
import CustomAlert from "../components/CustomAlert";
import { useTheme } from "../context/ThemeContext";
import { useUserData } from "../context/UserDataContext";

export default function FamilyScreen() {
  const [showCreateFamilyModal, setShowCreateFamilyModal] =
    React.useState(false);
  const [newFamilyNameModal, setNewFamilyNameModal] = React.useState("");
  const [creatingFamilyModal, setCreatingFamilyModal] = React.useState(false);
  const [createFamilyError, setCreateFamilyError] = React.useState<
    string | null
  >(null);
  const [showFamilyPicker, setShowFamilyPicker] = React.useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  // État pour l'alerte personnalisée
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertTitle, setAlertTitle] = React.useState("");
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertOnConfirm, setAlertOnConfirm] = React.useState<() => void>(
    () => {}
  );

  // Utiliser le contexte UserData
  const {
    families: contextFamilies,
    selectedFamily,
    setSelectedFamily,
  } = useUserData();

  let families = contextFamilies;

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
    if (params.user) user = JSON.parse(params.user as string);
  } catch {}

  // Pour affichage principal
  const hasFamily = selectedFamily && selectedFamily.name;
  const familyName = hasFamily ? selectedFamily.name : null;
  const members =
    hasFamily &&
    Array.isArray(selectedFamily.member_names) &&
    Array.isArray(selectedFamily.members) &&
    selectedFamily.member_names.length === selectedFamily.members.length
      ? selectedFamily.member_names.map((name: string, idx: number) => ({
          name,
          id: selectedFamily.members[idx],
        }))
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

  function handleRemoveUserFromFamily(userName: string) {
    setAlertTitle("Retirer un membre");
    setAlertMessage(
      `Êtes-vous sûr de vouloir retirer "${userName}" de la famille ?`
    );
    setAlertOnConfirm(() => async () => {
      setAlertVisible(false);
      try {
        const api = Constants?.expoConfig?.extra?.API_URL || "";
        const token = await getAccessToken();

        const familyId = selectedFamily?.id;
        if (!familyId) {
          alert("Aucune famille sélectionnée.");
          return;
        }

        // Chercher l'ID de l'utilisateur à partir de son nom
        // Besoin d'obtenir l'ID de l'utilisateur - on va le faire via une requête ou l'extraire des résultats
        // Pour l'instant, on va faire une requête pour chercher l'utilisateur
        let userId = null;

        // Chercher dans les résultats de recherche précédents
        if (results.length > 0) {
          const foundUser = results.find((u) => u.username === userName);
          if (foundUser) {
            userId = foundUser.id;
          }
        }

        if (!userId) {
          alert("Impossible de trouver l'ID de l'utilisateur.");
          return;
        }

        const url = `${api}families/${familyId}/remove-members/`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ user_ids: [userId] }),
        });

        let text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
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
          alert("Utilisateur retiré de la famille !");
          // Re-fetch user data après suppression
          const userRes = await fetch(`${api}user-data/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          const userData = await userRes.json();
          // Actualiser le contexte
          const updatedFamily = userData.families?.find(
            (f: any) => f.id === selectedFamily.id
          );
          if (updatedFamily) {
            setSelectedFamily(updatedFamily);
          }
        }
      } catch (e) {
        alert("Erreur lors du retrait de la famille");
      }
    });
    setAlertVisible(true);
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

  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onCancel={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
        cancelText="Annuler"
        confirmText="Retirer"
      />
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.logoutIcon}
          onPress={() => router.replace("/home")}
        >
          <MaterialIcons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.homeTitle}>FAMILY {familyName}</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ alignItems: "center", paddingTop: 72 }}
      >
        <View style={styles.familyBlock}>
          {/* Sélectionneur de famille */}
          {families.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.familySelector}
                onPress={() => setShowFamilyPicker(!showFamilyPicker)}
              >
                <Text style={styles.familySelectorLabel}>
                  Sélectionner une famille
                </Text>
                <Text style={styles.familySelectorValue}>
                  {selectedFamily?.name || "Aucune"}
                </Text>
              </TouchableOpacity>

              {showFamilyPicker && (
                <View style={styles.familyPickerBlock}>
                  {families.map((family: any) => (
                    <TouchableOpacity
                      key={family.id}
                      style={[
                        styles.familyPickerItem,
                        selectedFamily?.id === family.id && {
                          backgroundColor: colors.action,
                          borderRadius: 8,
                        },
                      ]}
                      onPress={() => {
                        setSelectedFamily(family);
                        setShowFamilyPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.familyPickerItemText,
                          selectedFamily?.id === family.id && {
                            color: "#fff",
                            fontWeight: "bold",
                          },
                        ]}
                      >
                        {family.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

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

          <>
            <Text style={styles.familyTitle}>Famille</Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.membersTitle}>Membres :</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {members.map((member, idx) => (
                  <View
                    key={member.id}
                    style={[
                      styles.card,
                      {
                        width: "47%",
                        marginRight: idx % 2 === 0 ? "6%" : 0,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.membersTitle}>{member.name}</Text>
                    </View>
                    {/* Icône poubelle pour supprimer le membre */}
                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        padding: 4,
                      }}
                      onPress={() => handleRemoveUserFromFamily(member.name)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={22}
                        color="#b00"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
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
                <MaterialIcons name="send" size={18} color={colors.text} />
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
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
    homeTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      letterSpacing: 1,
    },
    logoutIcon: {
      padding: 4,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      justifyContent: "flex-start",
    },
    familyBlock: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 18,
      shadowColor: colors.primary,
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
      color: colors.text,
      marginBottom: 6,
    },
    familyName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    card: {
      backgroundColor: colors.primary,
      width: "50%",
      height: 100,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      shadowColor: colors.primary,
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    membersTitle: {
      fontSize: 15,
      color: colors.icon,
      marginBottom: 8,
      marginLeft: 2,
    },
    membersList: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 10,
    },
    familySelector: {
      backgroundColor: colors.tertiary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.action,
    },
    familySelectorLabel: {
      fontSize: 12,
      color: colors.icon,
      marginBottom: 4,
    },
    familySelectorValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    familyPickerBlock: {
      backgroundColor: colors.tertiary,
      borderRadius: 8,
      paddingVertical: 8,
      marginBottom: 16,
    },
    familyPickerItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
    },
    familyPickerItemText: {
      fontSize: 15,
      color: colors.text,
    },
    searchUserRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 8,
    },
    searchUserInput: {
      flex: 1,
      backgroundColor: colors.tertiary,
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      marginRight: 8,
    },
    searchUserButton: {
      backgroundColor: colors.action,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    searchUserButtonText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 15,
    },
    searchResultsBlock: {
      marginTop: 8,
      backgroundColor: colors.secondary,
      borderRadius: 8,
      padding: 8,
    },
    searchResultText: {
      color: colors.text,
      fontSize: 14,
      marginBottom: 4,
    },
    addUserButton: {
      backgroundColor: colors.action,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 2,
      marginLeft: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    addUserButtonText: {
      color: colors.text,
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
      backgroundColor: colors.tertiary,
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginRight: 8,
      height: 50,
    },
    createFamilyButton: {
      backgroundColor: colors.action,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    createFamilyButtonText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 15,
    },
  });
