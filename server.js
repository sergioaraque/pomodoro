/**
 * FocusNature — server.js
 *
 * Rutas:
 *   /          → Landing page (landing.html)
 *   /guest     → Pomodoro sin registro (guest.html)
 *   /app       → App completa con login (index.html, con inyección de Supabase)
 *   /assets    → CSS, JS, etc. (express.static)
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
    .setHeader('Cache-Control', 'no-store')
    .send(html);
}

// ── 4. Express ────────────────────────────────────────────────────────
const express = require('express');
const app     = express();

// Sirve CSS/JS/assets — { index: false } para que index.html
// nunca se sirva en crudo (siempre pasa por buildAppHtml).
// Explicitly set JS MIME type — browsers reject ES modules without application/javascript
const serveStatic = require('serve-static');
app.use(express.static(PUBLIC, {
  index: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

// ── RUTAS ──────────────────────────────────────────────────────────────
// Landing
app.get('/', (_req, res) => {
  try   { send(res, readHtml('landing.html')); }
  catch { res.status(500).send('Error cargando la landing'); }
});

// Pomodoro invitado — sin inyección de Supabase
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
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Config:   ${fs.existsSync(envPath) ? '.env' : 'variables de entorno'}\n`);
});
