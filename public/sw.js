/**
 * sw.js — Service Worker con estrategia de caché mejorada
 * Versión: v5 (incrementar para forzar actualización global)
 */

const CACHE_NAME = 'focusnature-v5';
const STATIC_ASSETS = [
  '/',
  '/guest',
  '/manifest.json',
  '/styles.css',
  '/src/js/app.js',
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
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;600&family=Nunito:wght@300;400;600&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

// Archivos que NUNCA deben cachearse (dinámicos)
const NEVER_CACHE = [
  '/app',
  '/index.html',
  /^.*\/app$/
];

// Instalación: cachear assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => 
        Promise.all(
          keys.filter(key => key !== CACHE_NAME)
              .map(key => caches.delete(key))
        )
      ),
      self.clients.claim() // Tomar control inmediato
    ])
  );
});

// Estrategia: network-first para HTML, stale-while-revalidate para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // No cachear solicitudes a Supabase
  if (url.hostname.includes('supabase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // No cachear archivos dinámicos
  if (NEVER_CACHE.some(pattern => {
    if (pattern instanceof RegExp) return pattern.test(url.pathname);
    return url.pathname === pattern;
  })) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Para assets estáticos: cache-first con revalidación en segundo plano
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Para navegación (páginas HTML): network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(cached => {
              if (cached) return cached;
              return caches.match('/');
            });
        })
    );
    return;
  }

  // Para todo lo demás: network-first
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Mensajes para limpiar caché manualmente
self.addEventListener('message', event => {
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage('CACHE_CLEARED');
    });
  }
});