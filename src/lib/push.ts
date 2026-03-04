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

const ensureServiceWorker = async () => {
  // Si ya hay un SW controlando la página, úsalo
  if (navigator.serviceWorker.controller) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) return reg;
  }

  // Si no hay registro, registra el SW principal
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

  // Espera a que esté listo (activo y controlando)
  await navigator.serviceWorker.ready;

  // Si todavía no controla (primera vez), recarga para tomar control
  if (!navigator.serviceWorker.controller) {
    window.location.reload();
    return null;
  }

  return reg;
};

export const getFcmToken = async () => {
  if (!isPushSupported()) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn("FCM_NOT_SUPPORTED");
    return null;
  }

  try {
    console.log('FCM_SW_READY_WAIT');
    const registration = await ensureServiceWorker();
    if (!registration) return null;

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return null;

    console.log('FCM_TOKEN_START');
    const token = await getToken(messaging as any, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM_TOKEN_OK');
      return token;
    }

    console.warn('FCM_TOKEN_EMPTY');
    return null;
  } catch (error) {
    console.error('FCM_TOKEN_ERROR', error);
    return null;
  }
};
