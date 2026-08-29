// CampuSwap Service Worker — Push Notifications

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('push', (e) => {
  if (!e.data) return;

  const data = e.data.json();

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    //badge: '/favicon.svg',
    tag: data.tag || 'campuswap-notification',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'View Message' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  if (e.action === 'close') return;

  const url = e.notification.data?.url || '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
