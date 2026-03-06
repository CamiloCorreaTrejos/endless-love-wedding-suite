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
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("FCM_VAPID_MISSING");
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn("FCM_NOT_SUPPORTED");
    return null;
  }

  // ✅ FORZAR a usar la registration del SW de Firebase (scope '/')
  let registration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");

  if (!registration) {
    console.log("FCM_SW_REGISTER_START", { path: "/firebase-messaging-sw.js" });
    registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    console.log("FCM_SW_REGISTER_OK");
  } else {
    console.log("FCM_SW_FOUND");
  }

  // ✅ Espera a que el SW esté activo
  if (!registration.active) {
    await new Promise<void>((resolve) => {
      const sw = registration!.installing || registration!.waiting;
      if (!sw) return resolve();
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated") resolve();
      });
    });
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("FCM_PERMISSION_DENIED");
    return null;
  }

  try {
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
  } catch (err) {
    console.error("FCM_TOKEN_ERROR", err);
    return null;
  }
};