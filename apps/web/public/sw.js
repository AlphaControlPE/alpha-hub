/* Alpha Hub — service worker (PWA offline).
 *
 * Estratégias:
 * - Páginas (navegação): network-first → cache → /offline.
 *   Dados do marketplace nunca ficam velhos; cache só entra sem rede.
 * - Assets estáticos (/_next/static, imagens, fontes): stale-while-revalidate.
 *   São hashados/estáveis; servir do cache é seguro e rápido.
 * - Cross-origin (API, WebSocket): passa direto — nunca interceptar.
 *
 * Para invalidar tudo num deploy futuro, basta trocar VERSION.
 */
const VERSION = 'ah-v2';
const PRECACHE = VERSION + '-pre';
const RUNTIME = VERSION + '-run';
const CORE = ['/offline', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const response = await network;
  return response || new Response('Offline', { status: 503, statusText: 'Offline' });
}

async function networkFirst(request, usarFallbackOffline) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (usarFallbackOffline) {
      const offline = await caches.match('/offline');
      if (offline) return offline;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // API/WebSocket/terceiros: nunca interceptar (auth, tempo real, CORS).
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith('/_next/static/') ||
    /\.(png|svg|ico|webp|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, true));
    return;
  }

  event.respondWith(networkFirst(request, false));
});
