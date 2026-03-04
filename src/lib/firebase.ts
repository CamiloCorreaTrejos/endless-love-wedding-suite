import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("FIREBASE_INIT_START");

export const app = initializeApp(firebaseConfig);

// Messaging solo si es soportado (evita crashes)
export const messaging = await (async () => {
  try {
    const ok = await isSupported();
    if (!ok) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
})();

console.log("FIREBASE_INIT_OK");
