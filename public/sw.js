/**
 * sw.js — Service Worker de FocusNature
 *
 * Estrategia: Network-first con fallback a caché.
 * - JS/CSS: siempre intenta la red primero, actualiza la caché, usa fallback si offline
 * - Navegación: network-first, fallback a /app si offline
 * - Supabase/API: nunca interceptar
 *
 * Esto garantiza que los usuarios siempre reciben el código más reciente
 * cuando tienen conexión, y pueden usar la app offline si ya la visitaron.
 */

const CACHE = 'focusnature-v2';
const STATIC = [
  '/styles.css',
  '/manifest.json',
  '/src/js/app.js',
  '/src/js/config.js',
  '/src/js/ui.js',
  '/src/js/timer.js',
  '/src/js/sound.js',
  '/src/js/ambient.js',
  '/src/js/creatures.js',
  '/src/js/confetti.js',
  '/src/js/db.js',
  '/src/js/notifications.js',
  '/src/js/i18n.js',
  '/src/js/commands.js',
];

// ── Install: pre-cache static assets ─────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // addAll but don't fail install if one resource 404s
      return Promise.allSettled(STATIC.map(url => c.add(url)));
    })
  );
});

// ── Activate: delete old caches ───────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Message: force refresh cache on demand ────────────────────────────
self.addEventListener('message', e => {
  if (e.data === 'CLEAR_CACHE') {
    caches.delete(CACHE).then(() => {
      e.ports[0]?.postMessage('CACHE_CLEARED');
    });
  }
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: network-first for everything except Supabase ───────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept Supabase, external fonts, or CDN calls
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('jsdelivr') ||
    url.hostname.includes('cdnjs')
  ) return;

  // Navigation requests: network-first, fallback to /app
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/app') || caches.match('/'))
    );
    return;
  }

  // Static assets: network-first, update cache, fallback to cache
  if (STATIC.some(path => url.pathname === path || url.pathname.startsWith('/src/') || url.pathname.startsWith('/icons/'))) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: network only (don't cache dynamic content)
});
