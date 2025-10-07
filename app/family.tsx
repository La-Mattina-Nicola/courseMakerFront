import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";

export default function FamilyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  let family = [];
  let user = null;
  try {
    if (params.family) family = JSON.parse(params.family as string);
    if (params.user) user = JSON.parse(params.user as string);
  } catch {}

  // Si une famille est transmise, utilise ses données, sinon affiche un message
  const hasFamily = family && family.name;
  const familyName = hasFamily ? family.name : null;
  const members =
    hasFamily && Array.isArray(family.member_names) ? family.member_names : [];

  const [search, setSearch] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [newFamilyName, setNewFamilyName] = React.useState("");
  const [creatingFamily, setCreatingFamily] = React.useState(false);

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const api = process.env.EXPO_PUBLIC_API;
      const token = process.env.EXPO_PUBLIC_TOKEN;
      const res = await fetch(
        `${api}user-search/?username=${encodeURIComponent(search)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
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
      const api = process.env.EXPO_PUBLIC_API;
      const token = process.env.EXPO_PUBLIC_TOKEN;
      const res = await fetch(`${api}families/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ name: newFamilyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur lors de la création");
      // Re-fetch user data après création
      const userRes = await fetch(`${api}user-data/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      });
      const userData = await userRes.json();
      // Navigue vers la page famille avec les nouvelles données
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
        <Text style={styles.homeTitle}>FAMILY</Text>
      </View>
      <View style={styles.familyBlock}>
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
            placeholder="Search user"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.searchUserButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchUserButtonText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
        {searching && (
          <ActivityIndicator color="orangered" style={{ marginTop: 8 }} />
        )}
        {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}
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
                  onPress={async () => {
                    // Appel API pour ajouter l'utilisateur à la famille
                    try {
                      const api = process.env.EXPO_PUBLIC_API;
                      const token = process.env.EXPO_PUBLIC_TOKEN;
                      // Remplace familyId par l'id réel de la famille
                      const familyId = 1;
                      const res = await fetch(
                        `${api}families/${familyId}/add-member/`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `${token}`,
                          },
                          body: JSON.stringify({ user_id: user.id }),
                        }
                      );
                      if (!res.ok) {
                        const err = await res.json();
                        alert("Erreur: " + JSON.stringify(err));
                      } else {
                        alert("Utilisateur ajouté à la famille !");
                      }
                    } catch (e) {
                      alert("Erreur lors de l'ajout à la famille");
                    }
                  }}
                >
                  <Text style={styles.addUserButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 8,
    marginBottom: 8,
  },
  createFamilyInput: {
    flex: 1,
    backgroundColor: Colors.dark.tertiary,
    color: Colors.dark.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 8,
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
