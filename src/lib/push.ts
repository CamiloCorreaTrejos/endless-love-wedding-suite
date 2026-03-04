import { getToken } from "firebase/messaging";
import { getMessagingSafe } from "./firebase";

const getEnv = (key: string) => {
  const w = (window as any);
  return w?.__ENV__?.[key] ?? (import.meta as any).env?.[key];
};

export const isPushSupported = () => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

export const requestNotificationPermission = async () => {
  if (!isPushSupported()) {
    throw new Error("Push no soportado en este navegador/contexto.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("FCM_PERMISSION_DENIED");
    throw new Error("Permiso de notificaciones denegado.");
  }

  console.log("FCM_PERMISSION_GRANTED");
  return permission;
};

export const getFcmToken = async () => {
  if (!isPushSupported()) return null;

  const vapidKey = getEnv("VITE_FIREBASE_VAPID_KEY");
  if (!vapidKey) {
    console.warn("FCM_VAPID_MISSING");
    return null;
  }

  try {
    console.log("FCM_SW_REGISTER_START");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("FCM_SW_REGISTER_OK");

    await requestNotificationPermission();

    const messaging = await getMessagingSafe();
    if (!messaging) {
      console.warn("FCM_NO_MESSAGING");
      return null;
    }

    console.log("FCM_TOKEN_START");
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("FCM_TOKEN_EMPTY");
      return null;
    }

    console.log("FCM_TOKEN_OK");
    return token;
  } catch (error) {
    console.error("FCM_TOKEN_ERROR", error);
    return null;
  }
};
