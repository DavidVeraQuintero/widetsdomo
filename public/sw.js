// One-time self-destructing service worker.
// Clears all stale caches, reloads open tabs to load fresh code, then unregisters.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(c => c.navigate(c.url));
        return self.registration.unregister();
      })
  );
  self.clients.claim();
});
