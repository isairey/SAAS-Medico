// PADCOM GLOBAL — Service Worker para PWA Offline
// Permite que pacientes registrem relatos diários mesmo sem internet

const CACHE_NAME = 'padcom-v1';
const OFFLINE_QUEUE_KEY = 'padcom-offline-queue';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: try network, queue if offline
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'POST' || request.method === 'PUT') {
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          // Queue the request for later sync
          const body = await request.clone().text();
          const queueItem = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body,
            timestamp: Date.now(),
          };
          
          // Store in IndexedDB via message to client
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'OFFLINE_QUEUE_ADD',
              payload: queueItem,
            });
          });

          return new Response(
            JSON.stringify({ 
              offline: true, 
              message: 'Salvo offline. Será sincronizado quando a conexão voltar.',
              queuedAt: queueItem.timestamp 
            }),
            { 
              status: 202, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
      );
      return;
    }

    // GET API calls: network-first
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Background sync when connection returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'padcom-sync-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
  });
}

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
