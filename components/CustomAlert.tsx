import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  inputValue?: string;
  onInputChange?: (text: string) => void;
  inputPlaceholder?: string;
  confirmDisabled?: boolean;
}

export default function CustomAlert({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText = "Annuler",
  confirmText = "Confirmer",
  inputValue,
  onInputChange,
  inputPlaceholder,
  confirmDisabled = false,
}: CustomAlertProps) {
  const { colors } = useTheme();
  const themedStyles = getStyles(colors);
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={themedStyles.overlay}>
        <View style={themedStyles.alertBox}>
          <Text style={themedStyles.title}>{title}</Text>
          <Text style={themedStyles.message}>{message}</Text>

          {inputValue !== undefined && onInputChange && (
            <TextInput
              style={themedStyles.textInput}
              placeholder={inputPlaceholder || "Entrez le texte"}
              placeholderTextColor={colors.tertiary || "#888"}
              value={inputValue}
              onChangeText={onInputChange}
              autoFocus
            />
          )}

          <View style={themedStyles.buttonContainer}>
            <TouchableOpacity
              style={[themedStyles.button, themedStyles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={themedStyles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                themedStyles.button,
                themedStyles.confirmButton,
                confirmDisabled && themedStyles.confirmButtonDisabled,
              ]}
              disabled={confirmDisabled}
              onPress={onConfirm}
            >
              <Text style={themedStyles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    alertBox: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 24,
      width: "85%",
      maxWidth: 350,
      borderWidth: 2,
      borderColor: colors.tertiary,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 24,
      lineHeight: 22,
    },
    textInput: {
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.tertiary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
      minHeight: 50,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      justifyContent: "flex-end",
    },
    button: {
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
    confirmButtonDisabled: {
      backgroundColor: "#999",
      opacity: 0.5,
    },
    confirmButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 15,
    },
  });
}
