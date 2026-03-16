/**
 * build.js — Genera versionado de assets para evitar caché
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUBLIC_DIR = path.join(__dirname, 'public');
const SRC_DIR = path.join(PUBLIC_DIR, 'src', 'js');

// Generar hash de todos los JS
function generateVersion() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.js'));
  const hash = crypto.createHash('md5');
  
  files.sort().forEach(file => {
    const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
    hash.update(content);
  });
  
  return hash.digest('hex').slice(0, 8);
}

// Actualizar index.html con la versión
function updateHtmlVersion() {
  const version = generateVersion();
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Añadir/actualizar meta version
  if (content.includes('meta name="version"')) {
    content = content.replace(/meta name="version" content="[^"]+"/, `meta name="version" content="${version}"`);
  } else {
    content = content.replace('</head>', `  <meta name="version" content="${version}">\n</head>`);
  }
  
  // Añadir timestamp a los scripts importados
  content = content.replace(
    /<script type="module" src="\/src\/js\/([^"]+)">/g,
    `<script type="module" src="/src/js/$1?v=${version}">`
  );
  
  fs.writeFileSync(indexPath, content);
  console.log(`✅ Versión ${version} generada`);
}

updateHtmlVersion();