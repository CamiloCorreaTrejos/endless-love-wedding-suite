import { getToken, isSupported } from "firebase/messaging";
import { messaging } from "./firebase";

export const isPushSupported = () => {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
};

export const requestNotificationPermission = async () => {
  if (!isPushSupported()) throw new Error("Push no soportado en este navegador.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso de notificaciones no concedido.");

  console.log("FCM_PERMISSION_GRANTED");
  return permission;
};

export const getFcmToken = async (vapidKey: string) => {
  if (!isPushSupported()) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn("FCM_NOT_SUPPORTED");
    return null;
  }

  try {
    console.log("FCM_TOKEN_FLOW_START");

    // 1) Asegura permiso
    await requestNotificationPermission();

    // 2) Asegura que el SW correcto esté registrado (una sola vez)
    console.log("FCM_SW_READY_WAIT");
    const reg = await navigator.serviceWorker.getRegistration();

    // si no hay registro, registramos firebase-messaging-sw.js
    let activeReg = reg;
    if (!activeReg) {
      console.log("FCM_SW_REGISTER_START", { path: "/firebase-messaging-sw.js" });
      activeReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("FCM_SW_REGISTER_OK");
    }

    // 3) Espera a que esté listo
    await navigator.serviceWorker.ready;

    // 4) Si aún no controla la página, recarga una vez (necesario para algunos casos)
    if (!navigator.serviceWorker.controller) {
      console.warn("FCM_SW_NO_CONTROLLER_RELOAD");
      window.location.reload();
      return null;
    }

    // 5) Token
    console.log("FCM_TOKEN_START");
    const token = await getToken(messaging as any, {
      vapidKey,
      serviceWorkerRegistration: activeReg!,
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
