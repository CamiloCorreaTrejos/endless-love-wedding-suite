/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Firebase config (público)
firebase.initializeApp({
  apiKey: "AIzaSyDhx0N0SuCp2MojbuBiQlajv9Mu7wqOlP8",
  authDomain: "endless-love-organizer.firebaseapp.com",
  projectId: "endless-love-organizer",
  storageBucket: "endless-love-organizer.firebasestorage.app",
  messagingSenderId: "781574420745",
  appId: "1:781574420745:web:ff71a5bc62398bf8a73bd8",
});

const messaging = firebase.messaging();

// Background messages (FCM)
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Endless Love";
  const options = {
    body: payload?.notification?.body || "Tienes una nueva notificación.",
    icon: "/pwa-192.png",
    data: payload?.data || {},
  };
  self.registration.showNotification(title, options);
});

// Click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/notificaciones";
  event.waitUntil(clients.openWindow(url));
});

// IMPORTANT: activar inmediatamente updates del SW
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
