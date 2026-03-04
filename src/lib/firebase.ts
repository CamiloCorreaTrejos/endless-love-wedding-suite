import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const getEnv = (key: string) => {
  const w = (window as any);
  return w?.__ENV__?.[key] ?? (import.meta as any).env?.[key];
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID"),
};

console.log("FIREBASE_INIT_START");

let app: FirebaseApp | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (app) return app;

  // Validación mínima para no inicializar con env vacío
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    console.warn("FIREBASE_ENV_MISSING", {
      hasApiKey: !!firebaseConfig.apiKey,
      hasProjectId: !!firebaseConfig.projectId,
      hasAppId: !!firebaseConfig.appId,
    });
    return null;
  }

  try {
    app = initializeApp(firebaseConfig);
    console.log("FIREBASE_INIT_OK");
    return app;
  } catch (err) {
    console.error("FIREBASE_INIT_ERROR", err);
    return null;
  }
};

export const getMessagingSafe = async (): Promise<Messaging | null> => {
  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;

    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn("FCM_NOT_SUPPORTED");
        return null;
      }
      return getMessaging(firebaseApp);
    } catch (err) {
      console.error("FCM_MESSAGING_INIT_ERROR", err);
      return null;
    }
  })();

  return messagingPromise;
};
