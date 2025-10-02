import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Logique de connexion ici
    console.log("Connexion avec", email, password);
  };
  const handleRegister = () => {
    // Logique de connexion ici
    console.log("Connexion avec", email, password);
    router.push("/register");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom ou email"
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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRegister}>
        <Text style={styles.link}>Pas encore inscrit ? Crée un compte</Text>
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

export default LoginScreen;
