import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api, setGlobalPushToken } from "../api";

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
      console.log("[PUSH] Notification permission not granted (status: " + finalStatus + ").");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      DEFAULT_PROJECT_ID;

    // 1. Attempt Expo Push Token
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = pushTokenData.data;
      console.log("[PUSH] Expo Push Token generated successfully:", token);
    } catch (expoErr: any) {
      console.log("[PUSH WARN] Expo push token fetch failed:", expoErr.message);

      // 2. Fallback to Native Device Push Token (FCM on Android)
      try {
        const deviceTokenData = await Notifications.getDevicePushTokenAsync();
        token = typeof deviceTokenData.data === "string" ? deviceTokenData.data : JSON.stringify(deviceTokenData.data);
        console.log("[PUSH] Native Device Push Token generated successfully:", token);
      } catch (deviceErr: any) {
        console.log("[PUSH ERROR] Native device push token fetch also failed:", deviceErr.message);
      }
    }

    // 3. Set global push token cache & register with clinic NestJS backend
    if (token) {
      setGlobalPushToken(token);
    }

    if (token && userToken) {
      const res = await api.post("/patients/push-token", { pushToken: token }, userToken);
      console.log("[PUSH SUCCESS] Registered push token with clinic server:", res);
    } else {
      console.log("[PUSH WARN] Registration skipped - token: " + (token ? "YES" : "NULL") + ", userToken: " + (userToken ? "YES" : "NULL"));
    }
  } catch (outerErr: any) {
    console.log("[PUSH ERROR] Unexpected notification setup error:", outerErr.message);
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
      trigger: null,
    });
  } catch (err: any) {
    console.log("[LOCAL NOTIFICATION ERROR]", err.message);
  }
}
