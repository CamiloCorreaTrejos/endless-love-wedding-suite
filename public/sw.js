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
  const link = event.notification?.data?.link || "/?section=notificaciones";
  console.log('PUSH_SW_CLICK_LINK', link);
  event.waitUntil(clients.openWindow(link));
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
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      
      // Si el payload trae notification, el navegador/FCM lo maneja automáticamente.
      if (data.notification) {
         console.log('PUSH_SW_DUPLICATE_PREVENTED: Generic push contains notification object.');
         return;
      }
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  // Normalizar payload para soportar FCM HTTP v1 (data.data) o directo (data)
  const pushData = data?.data || data || {};
  
  // Solo mostramos si tiene contenido mínimo
  if (pushData.title || pushData.message) {
    console.log('PUSH_EDGE_DATA_ONLY_MODE: Generic push data-only normalized.');
    console.log('PUSH_SW_SHOW_NOTIFICATION');
    
    const title = pushData.title || 'Endless Love';
    const options = {
      body: pushData.message || 'Tienes una nueva actualización.',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: {
        link: pushData.link || '/?section=notificaciones',
        type: pushData.type || 'general'
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});
