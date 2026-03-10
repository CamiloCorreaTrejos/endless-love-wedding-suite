import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

export const isPushSupported = () => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
};

export const requestNotificationPermission = async () => {
  if (!isPushSupported()) {
    throw new Error("Las notificaciones push no están soportadas en este navegador.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permiso de notificaciones denegado.");
  }
  return permission;
};

/**export const getFcmToken = async () => {
  try {
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

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("FCM_PERMISSION_DENIED");
      return null;
    }

    console.log("FCM_TOKEN_FLOW_START");

    // Registrar o reutilizar el SW correcto
    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration || !registration.active?.scriptURL?.includes("firebase-messaging-sw.js")) {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }

    // Esperar a que quede activo
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration!.installing!.addEventListener("statechange", (e: any) => {
          if (e.target.state === "activated") resolve();
        });
      });
    }

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    await navigator.serviceWorker.ready;

    console.log("FCM_TOKEN_START");

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("FCM_TOKEN_EMPTY");
      return null;
    }

    console.log("FCM_TOKEN_OK", token);
    return token;
  } catch (error) {
    console.error("FCM_TOKEN_ERROR", error);
    return null;
  }
};*/

export const getFcmToken = async () => {
  try {
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

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("FCM_PERMISSION_DENIED");
      return null;
    }

    console.log("FCM_TOKEN_FLOW_START");

    // ✅ Buscar el SW de Firebase específicamente, no el de "/"
    const registrations = await navigator.serviceWorker.getRegistrations();
    let registration = registrations.find(r =>
      r.active?.scriptURL?.includes("firebase-messaging-sw.js") ||
      r.installing?.scriptURL?.includes("firebase-messaging-sw.js") ||
      r.waiting?.scriptURL?.includes("firebase-messaging-sw.js")
    );

    // ✅ Solo registrar si no existe ninguno
    if (!registration) {
      registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/firebase-cloud-messaging-push-scope", updateViaCache: "none" }
      );
    }

    // ✅ Esperar a que esté activo correctamente
    await new Promise<void>((resolve) => {
      if (registration!.active) {
        resolve();
        return;
      }
      const sw = registration!.installing || registration!.waiting;
      sw?.addEventListener("statechange", (e: any) => {
        if (e.target.state === "activated") resolve();
      });
    });

    await navigator.serviceWorker.ready;

    console.log("FCM_TOKEN_START");

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("FCM_TOKEN_EMPTY");
      return null;
    }

    console.log("FCM_TOKEN_OK", token);
    return token;

  } catch (error) {
    console.error("FCM_TOKEN_ERROR", error);
    return null;
  }
};