import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = () => {
    // Logique d'inscription ici
    if (password !== confirmPassword) {
      console.log("Les mots de passe ne correspondent pas");
      return;
    }
    console.log("Inscription avec", username, email, password);
  };

  const handleLogin = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        placeholderTextColor="#888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>S'inscrire</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogin}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    color: "#ffffff",
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
  },
  link: {
    color: "#888",
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
});

export default RegisterScreen;
