/* Nexos App — service worker: notificações push (v2: logo no badge) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'Nexos', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Nexos', {
    body: d.body || '',
    icon: new URL('icons/icon-192.png', self.location).href,
    badge: new URL('icons/badge-96.png', self.location).href, // silhueta branca da logo (Android pinta o ícone pequeno de branco)
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || '#/' },
    lang: 'pt-BR',
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alvo = new URL(e.notification.data && e.notification.data.url || '#/', self.registration.scope).href;
  e.waitUntil((async () => {
    const abas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abas) {
      if (c.url.startsWith(self.registration.scope)) { await c.focus(); try { await c.navigate(alvo); } catch { c.postMessage({ nav: alvo }); } return; }
    }
    await self.clients.openWindow(alvo);
  })());
});
