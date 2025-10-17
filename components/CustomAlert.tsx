import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/theme";

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
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {inputValue !== undefined && onInputChange && (
            <TextInput
              style={styles.textInput}
              placeholder={inputPlaceholder || "Entrez le texte"}
              placeholderTextColor="#888"
              value={inputValue}
              onChangeText={onInputChange}
              autoFocus
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                confirmDisabled && styles.confirmButtonDisabled,
              ]}
              disabled={confirmDisabled}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 350,
    borderWidth: 2,
    borderColor: Colors.dark.tertiary,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 24,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: Colors.dark.primary,
    borderWidth: 2,
    borderColor: Colors.dark.tertiary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.dark.text,
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
    backgroundColor: Colors.dark.tertiary,
    borderWidth: 2,
    borderColor: Colors.dark.action,
  },
  cancelButtonText: {
    color: Colors.dark.text,
    fontWeight: "bold",
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: Colors.dark.action,
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
