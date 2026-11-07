/* Nexos App — service worker: notificações push (v3: só a logo na bolinha, sem imagem à direita) */
// v4: guarda os arquivos do app no aparelho para abrir rápido mesmo com internet ruim
const CACHE = 'nx-app-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('nx-app-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

const ESTATICO = /\.(js|css|woff2|png|svg|jpg|jpeg|webp|webmanifest)$/i;
const avisar = (msg) => self.clients.matchAll({ type: 'window' }).then((cs) => cs.forEach((c) => c.postMessage(msg)));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith('/sw.js')) return; // Supabase, Garmin etc. vão direto
  // página (index.html): tenta a internet por até 3,5 s; se demorar ou faltar, abre a cópia guardada
  if (req.mode === 'navigate') {
    const chave = url.origin + url.pathname;
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const rede = fetch(req).then((r) => { if (r.ok && r.type === 'basic' && !r.redirected) cache.put(chave, r.clone()); return r; });
      const guardada = await cache.match(chave);
      if (!guardada) return rede;
      const lento = new Promise((ok) => setTimeout(() => ok(guardada), 3500));
      return Promise.race([rede.catch(() => guardada), lento]);
    })());
    return;
  }
  if (!ESTATICO.test(url.pathname)) return;
  // arquivos (js, css, fontes, ícones): usa a cópia guardada na hora e atualiza por trás
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const guardada = await cache.match(req, { ignoreSearch: true });
    const rede = fetch(req).then(async (r) => {
      if (r.ok && r.type === 'basic') {
        const mudou = guardada && /\/app\/(app\.css|js\/[^/]+\.js)$/.test(url.pathname) && guardada.headers.get('etag') && r.headers.get('etag') !== guardada.headers.get('etag');
        await cache.put(req, r.clone());
        if (mudou) avisar({ atualizado: true });
      }
      return r;
    });
    if (guardada) { e.waitUntil(rede.catch(() => {})); return guardada; }
    return rede;
  })());
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'Nexos', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Nexos', {
    body: d.body || '',
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
