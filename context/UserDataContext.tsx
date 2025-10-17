import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface Family {
  id: number;
  name: string;
  [key: string]: any;
}

interface ShoppingList {
  id: number;
  name: string;
  family: number;
  items?: any[];
  [key: string]: any;
}

interface UserData {
  families: Family[];
  shopping_lists: ShoppingList[];
  [key: string]: any;
}

interface User {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

interface UserDataContextType {
  userData: UserData | null;
  user: User | null;
  families: Family[];
  shoppingLists: ShoppingList[];
  loading: boolean;
  error: string | null;
  fetchUserData: (silent?: boolean) => Promise<void>;
  refreshUserData: () => Promise<void>;
  selectedFamily: Family | null;
  setSelectedFamily: (family: Family | null) => void;
  selectedShoppingList: ShoppingList | null;
  setSelectedShoppingList: (list: ShoppingList | null) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);

/**
 * Provider pour mettre en cache les données utilisateur (familles, listes de courses)
 * Permet d'éviter les appels API répétés dans ingredient.tsx et recipe.tsx
 */
export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const api = Constants?.expoConfig?.extra?.API_URL ?? "";
  const [userData, setUserData] = useState<UserData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedShoppingList, setSelectedShoppingList] =
    useState<ShoppingList | null>(null);

  const fetchUserData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);
        const token = await AsyncStorage.getItem("accessToken");

        // Ne pas faire d'appel si pas de token
        if (!token) {
          setUserData(null);
          if (!silent) setLoading(false);
          return;
        }

        const res = await fetch(`${api}user-data/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error("Réponse inattendue du serveur.");
        }
        if (!res.ok) {
          throw new Error(
            "Erreur lors de la récupération des données utilisateur: " +
              JSON.stringify(data)
          );
        }
        setUserData(data);
        // Extraire les données utilisateur
        if (data.user) {
          setUser(data.user);
        } else if (data.username) {
          // Si les données utilisateur sont au même niveau que families
          setUser({
            username: data.username,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            id: data.id,
          });
        }
      } catch (e: any) {
        setError(e.message);
        setUserData(null);
        setUser(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [api]
  );

  const refreshUserData = useCallback(async () => {
    await fetchUserData(false);
  }, [fetchUserData]);

  const families = userData?.families || [];
  const shoppingLists = userData?.shopping_lists || [];

  // Charger les données au montage du provider
  useEffect(() => {
    fetchUserData(false);
  }, [fetchUserData]);

  // Auto-sélectionne la première famille et liste de courses si elles ne sont pas sélectionnées
  useEffect(() => {
    if (families.length > 0 && !selectedFamily) {
      setSelectedFamily(families[0]);
    }
    if (shoppingLists.length > 0 && !selectedShoppingList) {
      setSelectedShoppingList(shoppingLists[0]);
    }
  }, [families, shoppingLists, selectedFamily, selectedShoppingList]);

  // Auto-sélectionne la famille en fonction de la liste de courses sélectionnée
  useEffect(() => {
    if (selectedShoppingList && families.length > 0) {
      const correspondingFamily = families.find(
        (f) => f.id === selectedShoppingList.family
      );
      if (correspondingFamily) {
        setSelectedFamily(correspondingFamily);
      }
    }
  }, [selectedShoppingList, families]);

  const value: UserDataContextType = {
    userData,
    user,
    families,
    shoppingLists,
    loading,
    error,
    fetchUserData,
    refreshUserData,
    selectedFamily,
    setSelectedFamily,
    selectedShoppingList,
    setSelectedShoppingList,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte UserData
 */
export const useUserData = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData doit être utilisé dans UserDataProvider");
  }
  return context;
};
