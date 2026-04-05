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
  console.log('[SW] onBackgroundMessage received', payload);

  if (payload.notification) {
    console.log('PUSH_SW_DUPLICATE_PREVENTED: Payload contains notification object, letting browser handle it.');
    return;
  }

  console.log('PUSH_EDGE_DATA_ONLY_MODE: Payload is data-only, showing notification manually.');
  console.log('PUSH_SW_SHOW_NOTIFICATION');

  const title = payload?.data?.title || "Endless Love";
  const options = {
    body: payload?.data?.message || "Tienes una nueva notificación.",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    data: payload?.data || {},
  };
  self.registration.showNotification(title, options);
});

// Click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.link || event.notification?.data?.url || "/?section=notificaciones";
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
  console.log('[SW] Push Received', event);
  
  // Si el evento push viene de FCM, onBackgroundMessage lo manejará (o el navegador si trae notification).
  // Para evitar duplicar con el listener genérico 'push', podemos intentar parsear y ver si es de FCM.
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      // Si es un payload de FCM, normalmente tiene data.fcmOptions o similar, 
      // pero para estar seguros, si ya lo maneja onBackgroundMessage, podríamos ignorarlo aquí.
      // Sin embargo, si es un push genérico (no FCM), lo mostramos.
      if (data.notification) {
         console.log('PUSH_SW_DUPLICATE_PREVENTED: Generic push contains notification object.');
         return;
      }
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  // Solo mostramos si no es un payload vacío o si estamos seguros de que no fue manejado
  if (data.title || data.message) {
    console.log('PUSH_EDGE_DATA_ONLY_MODE: Generic push data-only.');
    console.log('PUSH_SW_SHOW_NOTIFICATION');
    const title = data.title || 'Endless Love';
    const options = {
      body: data.message || 'Tienes una nueva actualización.',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: {
        url: data.link || '/?section=notificaciones'
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});
