import AsyncStorage from '@react-native-async-storage/async-storage';


export const storeTokens = async (access: string, refresh: string) => {
  try {
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des tokens', e);
  }
};


export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (e) {
  console.error("Erreur lors de la récupération de l'access token", e);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('refreshToken');
  } catch (e) {
  console.error("Erreur lors de la récupération du refresh token", e);
    return null;
  }
};


export const removeTokens = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  } catch (e) {
    console.error('Erreur lors de la suppression des tokens', e);
  }
};
