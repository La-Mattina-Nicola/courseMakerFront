import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const api = Constants.expoConfig?.extra?.API_URL ?? "";

export default function UserScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, families, loading, refreshUserData } = useUserData();
  const styles = getStyles(colors);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<
    "username" | "email" | "first_name" | "last_name" | "password" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<() => void>(() => {});

  const openEditModal = (
    field: "username" | "email" | "first_name" | "last_name" | "password"
  ) => {
    setEditField(field);
    if (field === "username") {
      setEditValue(user?.username || "");
    } else if (field === "email") {
      setEditValue(user?.email || "");
    } else if (field === "first_name") {
      setEditValue(user?.first_name || "");
    } else if (field === "last_name") {
      setEditValue(user?.last_name || "");
    } else {
      setEditValue("");
    }
    setCurrentPassword("");
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditField(null);
    setEditValue("");
    setCurrentPassword("");
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      showAlert("Erreur", "Veuillez remplir le champ requis");
      return;
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        showAlert("Erreur", "Token d'authentification manquant");
        return;
      }

      // Construire le body selon le champ modifié
      let body: any = {};
      if (editField === "username") {
        body.username = editValue;
      } else if (editField === "email") {
        body.email = editValue;
      } else if (editField === "first_name") {
        body.first_name = editValue;
      } else if (editField === "last_name") {
        body.last_name = editValue;
      } else if (editField === "password") {
        if (!currentPassword.trim()) {
          showAlert("Erreur", "Veuillez remplir tous les champs requis");
          setIsSaving(false);
          return;
        }
        body.password = editValue;
      }

      const response = await fetch(`${api}user-profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        const fieldLabel =
          editField === "username"
            ? "Nom d'utilisateur"
            : editField === "email"
            ? "Email"
            : editField === "first_name"
            ? "Prénom"
            : editField === "last_name"
            ? "Nom"
            : "Mot de passe";

        showAlert(`${fieldLabel} modifié avec succès`, "", async () => {
          closeEditModal();
          await refreshUserData();
        });
      } else {
        // Gestion spéciale pour les erreurs 400 (username déjà utilisé, etc.)
        let errorMessage = `Erreur lors de la modification du ${editField}`;

        if (response.status === 400) {
          // Essayer de récupérer le message d'erreur détaillé
          if (data.username) {
            errorMessage =
              data.username[0] || "Ce nom d'utilisateur est déjà utilisé";
          } else if (data.email) {
            errorMessage = data.email[0] || "Cet email est déjà utilisé";
          } else if (data.password) {
            errorMessage =
              data.password[0] || "Le mot de passe n'est pas valide";
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.detail) {
            errorMessage = data.detail;
          }
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        }

        showAlert("Erreur", errorMessage);
      }
    } catch (error) {
      showAlert("Erreur", "Une erreur s'est produite lors de la modification");
    } finally {
      setIsSaving(false);
    }
  };

  const showAlert = (
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => {
      setAlertVisible(false);
      onConfirm?.();
    });
    setAlertVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.action} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* User Avatar and Name */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color={colors.action} />
          </View>
          {user ? (
            <>
              <Text style={styles.userName}>
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username || "Utilisateur"}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || "Email non disponible"}
              </Text>
            </>
          ) : (
            <Text style={styles.userName}>Utilisateur</Text>
          )}
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <View style={styles.infoBlock}>
            <TouchableOpacity
              style={styles.editableRow}
              onPress={() => openEditModal("username")}
            >
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom d'utilisateur : </Text>
                <Text style={styles.infoValue}>{user?.username || "-"}</Text>
              </View>
              <Ionicons name="pencil" size={18} color={colors.action} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editableRow,
                { borderTopWidth: 1, borderTopColor: colors.tertiary },
              ]}
              onPress={() => openEditModal("email")}
            >
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email : </Text>
                <Text style={styles.infoValue}>{user?.email || "-"}</Text>
              </View>
              <Ionicons name="pencil" size={18} color={colors.action} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editableRow,
                { borderTopWidth: 1, borderTopColor: colors.tertiary },
              ]}
              onPress={() => openEditModal("first_name")}
            >
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prénom : </Text>
                <Text style={styles.infoValue}>{user?.first_name || "-"}</Text>
              </View>
              <Ionicons name="pencil" size={18} color={colors.action} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editableRow,
                { borderTopWidth: 1, borderTopColor: colors.tertiary },
              ]}
              onPress={() => openEditModal("last_name")}
            >
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom : </Text>
                <Text style={styles.infoValue}>{user?.last_name || "-"}</Text>
              </View>
              <Ionicons name="pencil" size={18} color={colors.action} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editableRow,
                { borderTopWidth: 1, borderTopColor: colors.tertiary },
              ]}
              onPress={() => openEditModal("password")}
            >
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mot de passe : </Text>
                <Text style={styles.infoValue}>••••••••</Text>
              </View>
              <Ionicons name="pencil" size={18} color={colors.action} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Families Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes Familles</Text>

          {families.length > 0 ? (
            families.map((family) => (
              <View key={family.id} style={styles.familyBlock}>
                <View style={styles.familyHeader}>
                  <Ionicons name="people" size={20} color={colors.action} />
                  <Text style={styles.familyName}>{family.name}</Text>
                </View>
                {family.member_names && family.member_names.length > 0 && (
                  <Text style={styles.memberCount}>
                    {family.member_names.length} membre
                    {family.member_names.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Vous n'avez pas encore de famille.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/family")}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Créer une famille</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{families.length}</Text>
              <Text style={styles.statLabel}>
                Famille{families.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View
              style={[
                styles.statBlock,
                { borderLeftWidth: 1, borderLeftColor: colors.tertiary },
              ]}
            >
              <Text style={styles.statNumber}>
                {families.reduce(
                  (sum, f) => sum + (f.member_names?.length || 0),
                  0
                )}
              </Text>
              <Text style={styles.statLabel}>
                Membre
                {families.reduce(
                  (sum, f) => sum + (f.member_names?.length || 0),
                  0
                ) !== 1
                  ? "s"
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={20} color={colors.action} />
            <Text style={styles.buttonText}>Paramètres</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Modifier{" "}
              {editField === "username"
                ? "le nom d'utilisateur"
                : editField === "email"
                ? "l'email"
                : editField === "first_name"
                ? "le prénom"
                : editField === "last_name"
                ? "le nom"
                : "le mot de passe"}
            </Text>

            {editField === "password" && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Mot de passe actuel"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={editValue}
                  onChangeText={setEditValue}
                />
              </>
            )}

            {editField !== "password" && (
              <TextInput
                style={styles.modalInput}
                placeholder={
                  editField === "username"
                    ? "Nouveau nom d'utilisateur"
                    : editField === "email"
                    ? "Nouvel email"
                    : editField === "first_name"
                    ? "Nouveau prénom"
                    : "Nouveau nom"
                }
                placeholderTextColor="#888"
                value={editValue}
                onChangeText={setEditValue}
                autoCapitalize={editField === "email" ? "none" : "sentences"}
                keyboardType={
                  editField === "email" ? "email-address" : "default"
                }
              />
            )}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeEditModal}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  isSaving && { opacity: 0.6 },
                ]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onCancel={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      marginBottom: 24,
      borderBottomWidth: 2,
      borderBottomColor: colors.tertiary,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    profileCard: {
      alignItems: "center",
      paddingVertical: 12,
      marginBottom: 12,
      backgroundColor: colors.secondary,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.tertiary,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    userName: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    userEmail: {
      fontSize: 14,
      color: colors.icon,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    infoBlock: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.tertiary,
      overflow: "hidden",
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 5,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.icon,
      fontWeight: "600",
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      maxWidth: "80%",
      textAlign: "right",
    },
    editableRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    familyBlock: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.tertiary,
      padding: 14,
      marginBottom: 12,
    },
    familyHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    familyName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: 10,
    },
    memberCount: {
      fontSize: 13,
      color: colors.icon,
      marginLeft: 30,
    },
    emptyState: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.tertiary,
      padding: 24,
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.action,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    actionButtonText: {
      color: "#fff",
      fontWeight: "bold",
      marginLeft: 8,
    },
    statsContainer: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.tertiary,
      overflow: "hidden",
    },
    statBlock: {
      flex: 1,
      paddingVertical: 16,
      alignItems: "center",
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.action,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.icon,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary,
      borderWidth: 2,
      borderColor: colors.action,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 10,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.action,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 24,
      width: "85%",
      maxWidth: 350,
      borderWidth: 2,
      borderColor: colors.tertiary,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    modalInput: {
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.tertiary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
      minHeight: 45,
    },
    modalButtonContainer: {
      flexDirection: "row",
      gap: 12,
      justifyContent: "flex-end",
      marginTop: 20,
    },
    modalButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 100,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: colors.tertiary,
      borderWidth: 2,
      borderColor: colors.action,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 15,
    },
    confirmButton: {
      backgroundColor: colors.action,
    },
    confirmButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 15,
    },
  });
