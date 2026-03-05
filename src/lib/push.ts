import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

export const isPushSupported = () => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

const isInIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export const requestNotificationPermission = async () => {
  if (!isPushSupported()) throw new Error("Push no soportado en este navegador.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso no concedido para notificaciones.");
  return permission;
};

export const getFcmToken = async () => {
  // 🔥 en preview embebido suele fallar: mejor no intentar
  if (isInIframe()) {
    console.warn("FCM_BLOCKED_IFRAME: Abre la app en una pestaña normal para activar push.");
    return null;
  }

  if (!isPushSupported()) return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("FCM_VAPID_MISSING: falta VITE_FIREBASE_VAPID_KEY");
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn("FCM_NOT_SUPPORTED: messaging no soportado en este entorno.");
    return null;
  }

  //  esto asegura que el SW YA está listo y activo
  const registration = await navigator.serviceWorker.ready;

  await requestNotificationPermission();

  try {
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
  } catch (err) {
    console.error("FCM_TOKEN_ERROR", err);
    return null;
  }
};