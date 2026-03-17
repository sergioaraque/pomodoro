/**
 * FocusNature — server.js
 *
 * Rutas:
 *   /          → Landing page (landing.html)
 *   /guest     → Pomodoro sin registro (guest.html)
 *   /app       → App completa con login (index.html, con inyección de Supabase)
 *   /assets    → CSS, JS, etc. (express.static)
 *   /clean-cache → Página para limpiar caché manualmente
 *
 * Configuración — crea un .env en la raíz (copia de .env.example):
 *   SUPABASE_URL=https://TU-PROYECTO.supabase.co
 *   SUPABASE_ANON=TU-ANON-KEY
 *   PORT=3000
 */

'use strict';

const fs   = require('fs');
const path = require('path');

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
const SUPABASE_URL  = (process.env.SUPABASE_URL  || '').trim();
const SUPABASE_ANON = (process.env.SUPABASE_ANON || '').trim();
const PORT          = parseInt(process.env.PORT || '3000', 10);

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('\n❌  Faltan las credenciales de Supabase.');
  console.error('   Crea el archivo .env en la raíz del proyecto:');
  console.error('   SUPABASE_URL=https://TU-PROYECTO.supabase.co');
  console.error('   SUPABASE_ANON=TU-ANON-KEY');
  console.error('   (cópialo de .env.example)\n');
  process.exit(1);
}
if (!SUPABASE_URL.startsWith('https://')) {
  console.error('\n❌  SUPABASE_URL no válida:', SUPABASE_URL);
  console.error('   Debe empezar por https://\n');
  process.exit(1);
}

// ── 3. Helpers ────────────────────────────────────────────────────────
const PUBLIC = path.join(__dirname, 'public');

function readHtml(filename) {
  return fs.readFileSync(path.join(PUBLIC, filename), 'utf8');
}

/**
 * Inyecta las credenciales de Supabase en index.html.
 * Usa delimitadores %%PLACEHOLDER%% para no colisionar con
 * los nombres de las propiedades JS (window.__SUPABASE_URL__).
 */
function buildAppHtml() {
  const raw = readHtml('index.html');
  return raw
    .replace(/%%SUPABASE_URL%%/g,  SUPABASE_URL)
    .replace(/%%SUPABASE_ANON%%/g, SUPABASE_ANON);
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

// Middleware: las páginas dinámicas nunca se cachean
app.use((req, res, next) => {
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
    if (filePath.endsWith('.html')) {
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
app.get('/clean-cache', (_req, res) => {
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
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Config:   ${fs.existsSync(envPath) ? '.env' : 'variables de entorno'}\n`);
});