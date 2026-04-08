/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDhx0N0SuCp2MojbuBiQlajv9Mu7wqOlP8",
  authDomain: "endless-love-organizer.firebaseapp.com",
  projectId: "endless-love-organizer",
  storageBucket: "endless-love-organizer.firebasestorage.app",
  messagingSenderId: "781574420745",
  appId: "1:781574420745:web:ff71a5bc62398bf8a73bd8",
});

const messaging = firebase.messaging();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage received', payload);

  // Si el payload ya trae notification, el navegador (FCM) lo va a mostrar automáticamente.
  if (payload.notification) {
    console.log('PUSH_SW_DUPLICATE_PREVENTED: Payload contains notification object, letting browser handle it.');
    return;
  }

  // Normalizar payload (en FCM SDK payload.data ya suele ser el objeto de datos, pero soportamos anidación)
  const pushData = payload?.data?.data || payload?.data || {};

  console.log('PUSH_EDGE_DATA_ONLY_MODE: Payload is data-only, showing notification manually.');
  console.log('PUSH_SW_SHOW_NOTIFICATION');

  const title = pushData.title || "Endless Love";
  const options = {
    body: pushData.message || "Tienes una nueva notificación.",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    data: {
      link: pushData.link || "/?section=notificaciones",
      type: pushData.type || "general"
    },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || "/?section=notificaciones";
  console.log('PUSH_SW_CLICK_LINK', link);
  event.waitUntil(clients.openWindow(link));
});