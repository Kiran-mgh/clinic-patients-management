import { Platform } from "react-native";

const TOKEN_KEY = "amar_patient_auth_token";

export async function saveAuthToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  } catch (err) {
    console.log("[STORAGE] Failed to save auth token:", err);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(TOKEN_KEY);
    } else {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
  } catch (err) {
    return null;
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
    } else {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.log("[STORAGE] Failed to remove auth token:", err);
  }
}
