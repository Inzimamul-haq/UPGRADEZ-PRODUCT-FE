// firebase-messaging-sw.js
// Background push message handler for StudyMate.
// This file MUST live at /public/firebase-messaging-sw.js and is served at the root
// so Firebase Messaging can register it as the service worker.
//
// NOTE: Service workers cannot use ES module imports — use the Firebase compat CDN scripts.
// The version here must match the `firebase` package version installed in the app.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// IMPORTANT: These values are public identifiers (not secrets) — hardcoded here because
// service workers have no access to Next.js env vars or the build system.
firebase.initializeApp({
  apiKey:            'AIzaSyBWS7PASbPJ054upR2t5keGSShZCtkNx6w',
  authDomain:        'inzu-cbc26.firebaseapp.com',
  projectId:         'inzu-cbc26',
  storageBucket:     'inzu-cbc26.firebasestorage.app',
  messagingSenderId: '645497131791',
  appId:             '1:645497131791:web:a6365c71f018b93365a47a',
});

const messaging = firebase.messaging();

// Called when a push arrives while the app tab is closed / backgrounded.
// When the tab is open, Firebase calls onMessage() in the app instead.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);

  const title = payload.notification?.title || 'StudyMate';
  const body  = payload.notification?.body  || 'You have a new notification.';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
  });
});

// Handle clicking on the notification (focus the app or open a new window)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const appUrl = self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if it's already open for our origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(appUrl) && 'focus' in client) {
          if (urlToOpen !== '/' && 'navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // Or open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
