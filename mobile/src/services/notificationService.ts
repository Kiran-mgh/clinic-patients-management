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
      });
    }

    if (Device.isDevice || Platform.OS === "android") {
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

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const pushTokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        token = pushTokenData.data;
        console.log("[PUSH] Expo Push Token generated:", token);

        if (token && userToken) {
          await api.post("/patients/push-token", { pushToken: token }, userToken);
          console.log("[PUSH] Successfully registered push token with clinic server.");
        }
      } catch (err: any) {
        console.log("[PUSH ERROR] Failed to fetch Expo push token:", err.message);
      }
    }
  } catch (outerErr: any) {
    console.log("[PUSH ERROR] Notification setup error:", outerErr.message);
  }

  return token;
}
