/**
 * FocusNature — server.js
 *
 * Rutas:
 *   /          → Landing page (landing.html)
 *   /guest     → Pomodoro sin registro (guest.html)
 *   /app       → App completa con login (index.html, con inyección de Appwrite)
 *   /assets    → CSS, JS, etc. (express.static)
 *   /clean-cache → Página para limpiar caché manualmente
 *
 * Configuración — crea un .env en la raíz (copia de .env.example):
 *   APPWRITE_ENDPOINT=https://TU-APPWRITE.ejemplo.com/v1
 *   APPWRITE_PROJECT_ID=TU-PROJECT-ID
 *   APPWRITE_DATABASE_ID=TU-DATABASE-ID
 *   PORT=3000
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const RateLimit = require('express-rate-limit');

// ── 1. Cargar .env ────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = val;
    });
}

// ── 2. Credenciales ───────────────────────────────────────────────────
const APPWRITE_ENDPOINT    = (process.env.APPWRITE_ENDPOINT    || '').trim();
const APPWRITE_PROJECT_ID  = (process.env.APPWRITE_PROJECT_ID  || '').trim();
const APPWRITE_DATABASE_ID = (process.env.APPWRITE_DATABASE_ID || '').trim();
const PORT                 = parseInt(process.env.PORT || '3000', 10);

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID) {
  console.error('\n❌  Faltan las credenciales de Appwrite.');
  console.error('   Crea el archivo .env en la raíz del proyecto:');
  console.error('   APPWRITE_ENDPOINT=https://TU-APPWRITE.ejemplo.com/v1');
  console.error('   APPWRITE_PROJECT_ID=TU-PROJECT-ID');
  console.error('   APPWRITE_DATABASE_ID=TU-DATABASE-ID');
  console.error('   (cópialo de .env.example)\n');
  process.exit(1);
}
if (!APPWRITE_ENDPOINT.startsWith('http://') && !APPWRITE_ENDPOINT.startsWith('https://')) {
  console.error('\n❌  APPWRITE_ENDPOINT no válido:', APPWRITE_ENDPOINT);
  console.error('   Debe empezar por http:// o https://\n');
  process.exit(1);
}

// ── 3. Helpers ────────────────────────────────────────────────────────
const PUBLIC = path.join(__dirname, 'public');

function readHtml(filename) {
  return fs.readFileSync(path.join(PUBLIC, filename), 'utf8');
}

/**
 * Inyecta las credenciales de Appwrite en index.html.
 * Usa delimitadores %%PLACEHOLDER%% para no colisionar con
 * los nombres de las propiedades JS (window.__APPWRITE_ENDPOINT__).
 */
function buildAppHtml() {
  const raw = readHtml('index.html');
  return raw
    .replace(/%%APPWRITE_ENDPOINT%%/g,    APPWRITE_ENDPOINT)
    .replace(/%%APPWRITE_PROJECT_ID%%/g,  APPWRITE_PROJECT_ID)
    .replace(/%%APPWRITE_DATABASE_ID%%/g, APPWRITE_DATABASE_ID);
}

function send(res, html) {
  res
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0')
    .setHeader('Pragma', 'no-cache')
    .setHeader('Expires', '0')
    .send(html);
}

// ── 4. Express ────────────────────────────────────────────────────────
const express = require('express');
const app     = express();

// Middleware: security headers + no-cache en páginas dinámicas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "connect-src 'self' https:; " +
    "img-src 'self' data: https:; " +
    "frame-src https://www.youtube.com https://youtube.com;"
  );
  if (req.path === '/app' || req.path === '/guest' || req.path === '/') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// Sirve CSS/JS/assets con caché corta + revalidación por ETag
// no-cache = "puedes cachear pero valida antes de usar" (rápido con 304, seguro con deploys)
app.use(express.static(PUBLIC, {
  index: false,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      // sw.js nunca debe cachearse — el navegador debe poder detectar
      // nuevas versiones en cada visita para activar el SW actualizado
      res.setHeader('Cache-Control', 'no-store');
    } else {
      // Assets: permite caché de 1 hora pero siempre revalida con ETag
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  },
}));

// ── RUTAS ──────────────────────────────────────────────────────────────
// Landing
app.get('/', (_req, res) => {
  try   { send(res, readHtml('landing.html')); }
  catch { res.status(500).send('Error cargando la landing'); }
});

// Pomodoro invitado
app.get('/guest', (_req, res) => {
  try   { send(res, readHtml('guest.html')); }
  catch { res.status(500).send('Error cargando el modo invitado'); }
});

// App completa — con credenciales inyectadas
app.get('/app', (_req, res) => {
  try   { send(res, buildAppHtml()); }
  catch (err) {
    console.error('Error sirviendo la app:', err.message);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para limpiar caché manualmente
const cleanCacheLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                 // máximo 100 solicitudes por IP en windowMs
});

app.get('/clean-cache', cleanCacheLimiter, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(PUBLIC, 'clean-cache.html'));
});

// Fallback: cualquier ruta desconocida → landing
app.get('*', (_req, res) => {
  try   { send(res, readHtml('landing.html')); }
  catch { res.status(404).send('Página no encontrada'); }
});

// ── ARRANQUE ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🌿 FocusNature arrancado');
  console.log(`   Landing:  http://localhost:${PORT}/`);
  console.log(`   Invitado: http://localhost:${PORT}/guest`);
  console.log(`   App:      http://localhost:${PORT}/app`);
  console.log(`   Clean cache: http://localhost:${PORT}/clean-cache`);
  console.log(`   Appwrite: ${APPWRITE_ENDPOINT} (project: ${APPWRITE_PROJECT_ID})`);
  console.log(`   Config:   ${fs.existsSync(envPath) ? '.env' : 'variables de entorno'}\n`);
});