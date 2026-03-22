/**
 * sw.js — Service Worker
 * Versión: v19
 *
 * Estrategia:
 *  - /app, /index.html, rutas dinámicas → siempre red (no cachear)
 *  - Appwrite API y CDN externos → siempre red (no interferir con auth)
 *  - Assets locales (.js, .css, imágenes) → network-first con fallback a caché
 *  - Navegación → network-first
 */

const CACHE_NAME = 'focusnature-v20';

// Solo assets locales ligeros que sabemos que existen
const STATIC_ASSETS = [
  '/manifest.json',
  '/styles.css',
  '/src/js/config.js',
  '/src/js/state.js',
  '/src/js/timer.js',
  '/src/js/db.js',
  '/src/js/ui.js',
  '/src/js/sound.js',
  '/src/js/creatures.js',
  '/src/js/ambient.js',
  '/src/js/ambient-scenes.js',
  '/src/js/confetti.js',
  '/src/js/commands.js',
  '/src/js/i18n.js',
  '/src/js/notifications.js',
  '/src/js/sync.js',
  '/src/js/auth.js',
  '/src/js/settings-handler.js',
  '/src/js/tasks-handler.js',
  '/src/js/stats-handler.js',
  '/src/js/forest.js',
  '/src/js/session-notes.js',
  '/src/js/favicon.js',
];

// Rutas que NUNCA deben cachearse (contienen credenciales inyectadas o son dinámicas)
const NEVER_CACHE_PATHS = ['/app', '/'];

// Instalación: pre-cachear assets locales de forma resiliente
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Añadir cada asset individualmente para que un fallo no rompa todo
      await Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] No se pudo cachear:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches de versiones anteriores y notificar a los clientes
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(async () => {
        // Notificar a todas las pestañas que hay una nueva versión activa
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME }));
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Nunca interceptar solicitudes a Appwrite ni externos (CDN, fuentes, etc.)
  // 2. Nunca interceptar recursos externos (CDN, fuentes, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Rutas dinámicas: no interceptar, el navegador las gestiona directamente
  if (NEVER_CACHE_PATHS.includes(url.pathname) || url.pathname.startsWith('/app')) {
    return;
  }

  // 4. Navegación (páginas HTML): network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 5. Assets locales: network-first con fallback a caché
  //    Así siempre se intenta obtener la versión más reciente
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Actualizar caché en background si la respuesta es válida
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Mensajes desde la app
self.addEventListener('message', event => {
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      if (event.ports[0]) event.ports[0].postMessage('CACHE_CLEARED');
    });
  }
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});