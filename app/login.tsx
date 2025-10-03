import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAccessToken, storeTokens } from "../utils/auth";

const LoginScreen = () => {
  useEffect(() => {
    const checkToken = async () => {
      const token = await getAccessToken();
      if (token) {
        // Vérification basique, pour une vraie validation il faudrait appeler l'API
        router.replace("/home");
      }
    };
    checkToken();
  }, []);
  const api = process.env.EXPO_PUBLIC_API;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${api}login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: email, password }),
      });
      if (!response.ok) {
        console.log(response);
        throw new Error("Identifiants invalides");
      }
      const data = await response.json();
      if (data.access && data.refresh) {
        await storeTokens(data.access, data.refresh);
        router.replace("/home");
      } else {
        throw new Error("Tokens manquants dans la réponse");
      }
    } catch (error) {
      console.error(error);
      // Afficher une erreur à l'utilisateur si besoin
    }
  };
  const handleRegister = () => {
    // Logique de connexion ici
    console.log("Connexion avec", email, password);
    router.push("/register");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={64}
    >
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Mot de passe"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((v) => !v)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRegister}>
        <Text style={styles.link}>Pas encore inscrit ? Crée un compte</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    paddingTop: 40,
    fontSize: 28,
    color: "#ffffff",
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "600",
    justifyContent: "center",
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 8,
    transform: [{ translateY: -11 }],
    padding: 8,
    zIndex: 1,
  },
});

export default LoginScreen;
