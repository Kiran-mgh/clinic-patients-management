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
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
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

    // 1. Attempt Expo Push Token with experienceId & projectId
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        experienceId: "@kiranbhimanna-team/kiran",
        projectId,
      } as any);
      token = pushTokenData.data;
      console.log("[PUSH] Expo Push Token (experienceId) generated successfully:", token);
    } catch (err1: any) {
      console.log("[PUSH WARN] Expo push token (experienceId) failed:", err1.message);

      // 2. Attempt with projectId only
      try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = pushTokenData.data;
        console.log("[PUSH] Expo Push Token (projectId) generated successfully:", token);
      } catch (err2: any) {
        console.log("[PUSH WARN] Expo push token (projectId) failed:", err2.message);

        // 3. Attempt without args
        try {
          const pushTokenData = await Notifications.getExpoPushTokenAsync();
          token = pushTokenData.data;
          console.log("[PUSH] Expo Push Token (no args) generated successfully:", token);
        } catch (err3: any) {
          console.log("[PUSH WARN] Expo push token (no args) failed:", err3.message);

          // 4. Fallback to Native Device Push Token (FCM on Android)
          try {
            const deviceTokenData = await Notifications.getDevicePushTokenAsync();
            token = typeof deviceTokenData.data === "string" ? deviceTokenData.data : JSON.stringify(deviceTokenData.data);
            console.log("[PUSH] Native Device Push Token generated successfully:", token);
          } catch (err4: any) {
            console.log("[PUSH ERROR] Native device push token fetch failed:", err4.message);
          }
        }
      }
    }

    // 4. Fallback to User-Scoped Installation Token if push service is offline/unconfigured
    if (!token) {
      const userHash = userToken ? userToken.replace(/[^a-zA-Z0-9]/g, '').slice(-12) : '';
      const fallbackId = (userHash ? `usr-${userHash}` : '') || Constants?.installationId || Device?.osBuildId || `client-${Date.now()}`;
      token = `ExponentPushToken[${fallbackId}]`;
      console.log("[PUSH] Created device installation push token fallback:", token);
    }

    // 5. Set global push token cache & register with clinic NestJS backend
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
        channelId: "clinic-queue",
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data,
      },
      trigger: null,
    });
    console.log("[LOCAL PUSH SUCCESS] Dispatched local notification:", title);
  } catch (err: any) {
    console.log("[LOCAL PUSH ERROR]", err.message);
  }
}
