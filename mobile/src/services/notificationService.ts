import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "../api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const DEFAULT_PROJECT_ID = "0489f480-11eb-4305-86b4-6207dbc695a0";

export async function registerForPushNotificationsAsync(userToken?: string | null): Promise<string | null> {
  let token: string | null = null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("clinic-queue", {
        name: "Clinic Queue & Token Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#213932",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[PUSH] Push notification permission not granted.");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      DEFAULT_PROJECT_ID;

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = pushTokenData.data;
      console.log("[PUSH] Expo Push Token generated:", token);

      if (token && userToken) {
        await api.post("/patients/push-token", { pushToken: token }, userToken);
        console.log("[PUSH] Successfully registered push token with clinic server.");
      }
    } catch (err: any) {
      console.log("[PUSH WARN] Expo push token fetch failed (expected on emulators without Google Play):", err.message);
    }
  } catch (outerErr: any) {
    console.log("[PUSH ERROR] Notification setup error:", outerErr.message);
  }

  return token;
}

export async function sendLocalNotification(title: string, body: string, data: Record<string, any> = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        data,
      },
      trigger: null, // trigger immediately
    });
  } catch (err: any) {
    console.log("[LOCAL NOTIFICATION ERROR]", err.message);
  }
}
