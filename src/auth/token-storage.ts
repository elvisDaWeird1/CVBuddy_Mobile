import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "cvbuddy.auth.token";

const getWebStorage = () => {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const getStoredToken = async () => {
  const webStorage = getWebStorage();

  if (webStorage) {
    return webStorage.getItem(TOKEN_KEY);
  }

  if (Platform.OS === "web") {
    return null;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const storeToken = async (token: string) => {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(TOKEN_KEY, token);
    return;
  }

  if (Platform.OS === "web") {
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearStoredToken = async () => {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.removeItem(TOKEN_KEY);
    return;
  }

  if (Platform.OS === "web") {
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
