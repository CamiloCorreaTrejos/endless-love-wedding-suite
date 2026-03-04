import { getMessagingSafe } from './firebase';
import { getToken } from 'firebase/messaging';

const VAPID_KEY =
  (import.meta as any)?.env?.VITE_FIREBASE_VAPID_KEY ||
  (window as any)?.__ENV__?.VITE_FIREBASE_VAPID_KEY ||
  'BMNHpF38rE3ILjPbHyUkkPU0cTDiEaw7PZ1X505dVgdwX5O17uwlF80c9SKjiP8brPWTjTJBz0I_xcsLv6WRXX8';

const SW_PATH = '/firebase-messaging-sw.js';

// Evita intentar Push dentro de previews/iframes (Build / Studio)
const isInIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export const isPushSupported = () => {
  // Push solo funciona en https o localhost
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  return (
    isSecure &&
    !isInIframe() &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

export const requestNotificationPermission = async () => {
  if (!isPushSupported()) throw new Error('Push no soportado en este entorno (iframe o no https).');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('FCM_PERMISSION_DENIED');
    throw new Error('Permiso no concedido para notificaciones.');
  }
  console.log('FCM_PERMISSION_GRANTED');
  return permission;
};

let cachedRegistration: ServiceWorkerRegistration | null = null;

const ensureFirebaseSwReady = async () => {
  if (!isPushSupported()) return null;

  // Reusa registro si ya existe
  if (cachedRegistration) return cachedRegistration;

  console.log('FCM_SW_REGISTER_START', { path: SW_PATH });

  const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });

  // IMPORTANTÍSIMO: esperar a que el SW esté "ready" (activated/controlando)
  await navigator.serviceWorker.ready;

  // Guarda cache
  cachedRegistration = reg;

  console.log('FCM_SW_REGISTER_OK');
  return reg;
};

export const getFcmToken = async () => {
  if (!isPushSupported()) {
    console.warn('FCM_UNSUPPORTED_ENV');
    return null;
  }

  if (!VAPID_KEY) {
    console.error('FCM_VAPID_MISSING');
    return null;
  }

  try {
    await requestNotificationPermission();

    const registration = await ensureFirebaseSwReady();
    if (!registration) return null;

    const messaging = await getMessagingSafe();
    if (!messaging) {
      console.warn("FCM_NO_MESSAGING");
      return null;
    }

    console.log('FCM_TOKEN_START');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      console.warn('FCM_TOKEN_EMPTY');
      return null;
    }

    console.log('FCM_TOKEN_OK');
    return token;
  } catch (err) {
    console.error('FCM_TOKEN_ERROR', err);
    return null;
  }
};
