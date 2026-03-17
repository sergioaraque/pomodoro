/**
 * sw.js — Service Worker
 * Versión: v6
 *
 * Estrategia:
 *  - /app, /index.html, rutas dinámicas → siempre red (no cachear)
 *  - Supabase API y CDN externos → siempre red (no interferir con auth)
 *  - Assets locales (.js, .css, imágenes) → network-first con fallback a caché
 *  - Navegación → network-first
 */

const CACHE_NAME = 'focusnature-v6';

// Solo assets locales ligeros que sabemos que existen
const STATIC_ASSETS = [
  '/manifest.json',
  '/styles.css',
  '/src/js/config.js',
  '/src/js/timer.js',
  '/src/js/db.js',
  '/src/js/ui.js',
  '/src/js/sound.js',
  '/src/js/creatures.js',
  '/src/js/ambient.js',
  '/src/js/confetti.js',
  '/src/js/commands.js',
  '/src/js/i18n.js',
  '/src/js/notifications.js',
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

// Activación: limpiar caches de versiones anteriores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Nunca interceptar solicitudes a Supabase (auth, DB, storage)
  if (url.hostname.includes('supabase') || url.hostname.includes('supabase.co')) {
    return; // dejar que el navegador lo gestione directamente
  }

  // 2. Nunca interceptar recursos externos (CDN, fuentes, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Rutas dinámicas que nunca deben cachearse
  if (NEVER_CACHE_PATHS.includes(url.pathname) || url.pathname.startsWith('/app')) {
    event.respondWith(fetch(event.request));
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