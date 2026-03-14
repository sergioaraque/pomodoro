// Carga .env si existe (sin dependencia de dotenv — lectura manual simple)
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const [key, ...rest] = line.trim().split('=');
      if (key && !key.startsWith('#') && rest.length) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
}

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

const SUPABASE_URL  = process.env.SUPABASE_URL  || '';
const SUPABASE_ANON = process.env.SUPABASE_ANON || '';

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('\n⚠️  SUPABASE_URL y SUPABASE_ANON no están configuradas.');
  console.warn('   Crea un archivo .env en la raíz del proyecto:');
  console.warn('   SUPABASE_URL=https://TU-PROYECTO.supabase.co');
  console.warn('   SUPABASE_ANON=TU-ANON-KEY\n');
}

// Sirve archivos estáticos de /public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta especial: inyecta la config de Supabase en el HTML principal
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Reemplaza los placeholders con los valores reales del servidor
  html = html
    .replace('__SUPABASE_URL__', SUPABASE_URL)
    .replace('__SUPABASE_ANON__', SUPABASE_ANON);

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`\n🌿 FocusNature corriendo en http://localhost:${PORT}`);
  console.log(`   Supabase: ${SUPABASE_URL ? '✅ configurado' : '❌ no configurado'}\n`);
});
