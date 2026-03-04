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

// PWA & Generic Push support
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push Received');
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || 'Endless Love';
  const options = {
    body: data.message || 'Tienes una nueva actualización.',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    data: {
      url: data.link || '/notificaciones'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
