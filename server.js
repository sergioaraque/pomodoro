/**
 * FocusNature — server.js
 *
 * Sirve el frontend e inyecta las credenciales de Supabase en tiempo
 * de arranque, para que nunca queden expuestas en el repositorio.
 *
 * ── Configuración ──────────────────────────────────────────────────
 * Crea un archivo .env en la raíz del proyecto (cópialo de .env.example):
 *
 *   SUPABASE_URL=https://TU-PROYECTO.supabase.co
 *   SUPABASE_ANON=TU-ANON-KEY
 *   PORT=3000
 *
 * O pásalas como variables de entorno al arrancar:
 *   SUPABASE_URL=... SUPABASE_ANON=... npm start
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── 1. Cargar .env manualmente (sin dotenv como dependencia) ──────────
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
      if (key && !(key in process.env)) {   // no sobreescribe vars de entorno reales
        process.env[key] = val;
      }
    });
}

// ── 2. Leer y validar credenciales ───────────────────────────────────
const SUPABASE_URL  = (process.env.SUPABASE_URL  || '').trim();
const SUPABASE_ANON = (process.env.SUPABASE_ANON || '').trim();
const PORT          = parseInt(process.env.PORT || '3000', 10);

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('\n❌  Faltan las credenciales de Supabase.\n');
  console.error('   Crea el archivo .env en la raíz del proyecto:');
  console.error('   ──────────────────────────────────────────────');
  console.error('   SUPABASE_URL=https://TU-PROYECTO.supabase.co');
  console.error('   SUPABASE_ANON=TU-ANON-KEY\n');
  console.error('   Puedes copiar .env.example como punto de partida.\n');
  process.exit(1);   // No arrancar con config vacía — evita el error del navegador
}

if (!SUPABASE_URL.startsWith('https://')) {
  console.error('\n❌  SUPABASE_URL no parece válida:', SUPABASE_URL);
  console.error('   Debe empezar por https://\n');
  process.exit(1);
}

// ── 3. Preparar el HTML con las variables inyectadas ─────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
const INDEX_PATH = path.join(PUBLIC_DIR, 'index.html');

if (!fs.existsSync(INDEX_PATH)) {
  console.error('\n❌  No se encuentra public/index.html\n');
  process.exit(1);
}

/**
 * Lee index.html, sustituye los dos placeholders y devuelve el HTML listo.
 * Se hace en cada petición para que cambios en el HTML durante desarrollo
 * no requieran reiniciar el servidor.
 */
function buildIndexHtml() {
  const raw = fs.readFileSync(INDEX_PATH, 'utf8');

  // Doble comprobación: avisar si los placeholders no están en el fichero
  if (!raw.includes('%%SUPABASE_URL%%') || !raw.includes('%%SUPABASE_ANON%%')) {
    console.warn('⚠️  Los placeholders __SUPABASE_URL__ / __SUPABASE_ANON__ no se encontraron en index.html');
  }

  return raw
    .replace(/%%SUPABASE_URL%%/g,  SUPABASE_URL)
    .replace(/%%SUPABASE_ANON%%/g, SUPABASE_ANON);
}

// ── 4. Servidor Express ───────────────────────────────────────────────
const express = require('express');
const app = express();

/**
 * IMPORTANTE — orden de los middlewares:
 *
 * express.static con { index: false } sirve todo EXCEPTO index.html.
 * Así, las peticiones a '/' y '/*.html' caen en nuestra ruta
 * personalizada que inyecta las variables antes de enviar el HTML.
 */
app.use(express.static(PUBLIC_DIR, { index: false }));

// Cualquier ruta que no sea un fichero estático → sirve index.html con vars inyectadas
// (esto también cubre F5 en subrutas futuras tipo /stats, /tasks, etc.)
app.get('*', (req, res) => {
  try {
    const html = buildIndexHtml();
    res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'no-store')  // evita que el browser cachee la versión sin vars
      .send(html);
  } catch (err) {
    console.error('Error sirviendo index.html:', err);
    res.status(500).send('Error interno del servidor');
  }
});

app.listen(PORT, () => {
  console.log('\n🌿 FocusNature arrancado');
  console.log(`   URL:      http://localhost:${PORT}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Entorno:  ${fs.existsSync(envPath) ? '.env cargado' : 'variables de entorno del sistema'}\n`);
});
