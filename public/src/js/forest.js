/**
 * forest.js — Bosque de pomodoros.
 *
 * Cada semana es un árbol. Los pomodoros determinan su frondosidad.
 * Los árboles crecen de nivel 0 (tocón muerto) a nivel 5 (árbol centenario con frutos).
 * Se muestran 9 semanas: la actual (grande, centrada) + las 8 anteriores (pequeñas, de izquierda a derecha).
 * Los colores del follaje cambian con las estaciones del año.
 */

// Pseudo-random determinista (seed + índice → 0..1)
function _rand(seed, i) {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000;
  return x - Math.floor(x);
}

// Devuelve la clave YYYY-MM-DD del lunes de la semana que contiene 'date'
function _weekKey(date) {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// YYYY-MM-DD → entero (seed para posición de frutos/flores)
function _dateSeed(k) { return parseInt(k.replace(/-/g, ''), 10); }

// Agrupa sesiones por semana → { weekKey: n_pomodoros }
function _buildWeekMap(sessions) {
  const m = {};
  sessions.forEach(s => {
    const k = _weekKey(s.completed_at);
    m[k] = (m[k] || 0) + 1;
  });
  return m;
}

// ── Detección de estación ──────────────────────────────────────────
function _getSeason() {
  const m = new Date().getMonth() + 1; // 1-12
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

// ── Paletas de copa por estación ──────────────────────────────────
const CANOPY = {
  summer: {
    1: [ { cy: 54, r: 12,   c: '#43a047' }, { cy: 43, r: 8.5,  c: '#66bb6a' } ],
    2: [ { cy: 51, r: 14.5, c: '#388e3c' }, { cy: 40, r: 11,   c: '#4caf50' }, { cy: 30, r: 7.5,  c: '#81c784' } ],
    3: [ { cy: 50, r: 16,   c: '#2e7d32' }, { cy: 38, r: 12.5, c: '#388e3c' }, { cy: 27, r: 9,    c: '#43a047' }, { cy: 18, r: 5.5, c: '#66bb6a' } ],
    4: [ { cy: 50, r: 17,   c: '#1b5e20' }, { cy: 36, r: 13.5, c: '#2e7d32' }, { cy: 23, r: 9.5,  c: '#388e3c' }, { cy: 13, r: 6,   c: '#43a047' }, { cy: 5, r: 3.5, c: '#66bb6a' } ],
    5: [ { cy: 50, r: 18,   c: '#1b5e20' }, { cy: 35, r: 15,   c: '#2e7d32' }, { cy: 22, r: 11,   c: '#33691e' }, { cy: 11, r: 7.5, c: '#388e3c' }, { cy: 3, r: 4.5, c: '#43a047' } ],
  },
  spring: {
    1: [ { cy: 54, r: 12,   c: '#66bb6a' }, { cy: 43, r: 8.5,  c: '#aed581' } ],
    2: [ { cy: 51, r: 14.5, c: '#4caf50' }, { cy: 40, r: 11,   c: '#81c784' }, { cy: 30, r: 7.5,  c: '#c5e1a5' } ],
    3: [ { cy: 50, r: 16,   c: '#388e3c' }, { cy: 38, r: 12.5, c: '#66bb6a' }, { cy: 27, r: 9,    c: '#a5d6a7' }, { cy: 18, r: 5.5, c: '#c8e6c9' } ],
    4: [ { cy: 50, r: 17,   c: '#2e7d32' }, { cy: 36, r: 13.5, c: '#43a047' }, { cy: 23, r: 9.5,  c: '#81c784' }, { cy: 13, r: 6,   c: '#a5d6a7' }, { cy: 5, r: 3.5, c: '#dcedc8' } ],
    5: [ { cy: 50, r: 18,   c: '#2e7d32' }, { cy: 35, r: 15,   c: '#43a047' }, { cy: 22, r: 11,   c: '#66bb6a' }, { cy: 11, r: 7.5, c: '#a5d6a7' }, { cy: 3, r: 4.5, c: '#c8e6c9' } ],
  },
  autumn: {
    1: [ { cy: 54, r: 12,   c: '#e65100' }, { cy: 43, r: 8.5,  c: '#ff8f00' } ],
    2: [ { cy: 51, r: 14.5, c: '#bf360c' }, { cy: 40, r: 11,   c: '#e64a19' }, { cy: 30, r: 7.5,  c: '#ffca28' } ],
    3: [ { cy: 50, r: 16,   c: '#b71c1c' }, { cy: 38, r: 12.5, c: '#c62828' }, { cy: 27, r: 9,    c: '#e65100' }, { cy: 18, r: 5.5, c: '#ffa726' } ],
    4: [ { cy: 50, r: 17,   c: '#880e4f' }, { cy: 36, r: 13.5, c: '#b71c1c' }, { cy: 23, r: 9.5,  c: '#c62828' }, { cy: 13, r: 6,   c: '#e65100' }, { cy: 5, r: 3.5, c: '#ffca28' } ],
    5: [ { cy: 50, r: 18,   c: '#880e4f' }, { cy: 35, r: 15,   c: '#ad1457' }, { cy: 22, r: 11,   c: '#b71c1c' }, { cy: 11, r: 7.5, c: '#e65100' }, { cy: 3, r: 4.5, c: '#ffa726' } ],
  },
  winter: {
    1: [ { cy: 54, r: 12,   c: '#37474f' }, { cy: 43, r: 8.5,  c: '#546e7a' } ],
    2: [ { cy: 51, r: 14.5, c: '#263238' }, { cy: 40, r: 11,   c: '#37474f' }, { cy: 30, r: 7.5,  c: '#78909c' } ],
    3: [ { cy: 50, r: 16,   c: '#1a237e' }, { cy: 38, r: 12.5, c: '#263238' }, { cy: 27, r: 9,    c: '#37474f' }, { cy: 18, r: 5.5, c: '#78909c' } ],
    4: [ { cy: 50, r: 17,   c: '#1a237e' }, { cy: 36, r: 13.5, c: '#283593' }, { cy: 23, r: 9.5,  c: '#37474f' }, { cy: 13, r: 6,   c: '#546e7a' }, { cy: 5, r: 3.5, c: '#90a4ae' } ],
    5: [ { cy: 50, r: 18,   c: '#1a237e' }, { cy: 35, r: 15,   c: '#283593' }, { cy: 22, r: 11,   c: '#1565c0' }, { cy: 11, r: 7.5, c: '#37474f' }, { cy: 3, r: 4.5, c: '#78909c' } ],
  },
};

const TRUNK_W = [0, 4, 5, 6, 7, 8];
const TRUNK_H = [0, 22, 25, 26, 27, 28];

// ── Contenido interno del árbol (sin etiqueta <svg>) ─────────────────
function _svgInner(pomodoros, seed, w, season) {
  const lvl = pomodoros === 0  ? 0
            : pomodoros <= 2   ? 1
            : pomodoros <= 5   ? 2
            : pomodoros <= 9   ? 3
            : pomodoros <= 14  ? 4 : 5;
  const cx      = 30;
  const canopy  = CANOPY[season] || CANOPY.summer;
  let   g       = '';

  if (lvl === 0) {
    g = `
      <rect x="25.5" y="51" width="9" height="24" rx="3" fill="#795548"/>
      <ellipse cx="30" cy="51" rx="13" ry="5" fill="#6d4c41"/>
      <ellipse cx="30" cy="50" rx="9"  ry="3" fill="#8d6e63"/>
      <line x1="23" y1="49" x2="15" y2="41" stroke="#795548" stroke-width="2"   stroke-linecap="round"/>
      <line x1="37" y1="49" x2="45" y2="41" stroke="#795548" stroke-width="2"   stroke-linecap="round"/>
      <line x1="15" y1="41" x2="11" y2="36" stroke="#795548" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="45" y1="41" x2="49" y2="36" stroke="#795548" stroke-width="1.5" stroke-linecap="round"/>
    `;
  } else {
    const tw = TRUNK_W[lvl];
    const th = TRUNK_H[lvl];
    const ty = 75 - th;

    g += `<rect x="${cx - tw / 2 - 0.5}" y="${ty + 4}" width="${tw + 1}" height="${th - 4}" rx="2" fill="#4e342e"/>`;
    g += `<rect x="${cx - tw / 2}"       y="${ty}"     width="${tw}"     height="${th}"      rx="2" fill="#5d4037"/>`;

    canopy[lvl].forEach(c => {
      g += `<circle cx="${cx}" cy="${c.cy}" r="${c.r}" fill="${c.c}"/>`;
    });

    // Frutos para árboles de alta productividad (verano/primavera lvl 4-5)
    if (lvl >= 4 && (season === 'summer' || season === 'spring')) {
      const ref = canopy[lvl][1];
      const fn  = lvl === 5 ? 9 : 5;
      const fc  = season === 'spring' ? '#e91e63' : lvl === 5 ? '#c62828' : '#e64a19';
      for (let i = 0; i < fn; i++) {
        const ang = (i / fn) * Math.PI * 2 + _rand(seed, i) * 1.2;
        const dst = ref.r * (0.28 + _rand(seed, i + 77) * 0.58);
        const fx  = (cx     + Math.cos(ang) * dst).toFixed(1);
        const fy  = (ref.cy + Math.sin(ang) * dst * 0.78).toFixed(1);
        g += `<circle cx="${fx}" cy="${fy}" r="2.4" fill="${fc}"/>`;
      }
    }

    // Flores de primavera (niveles 2+)
    if (season === 'spring' && lvl >= 2) {
      const ref = canopy[lvl].at(-1);
      const fn  = 3 + lvl;
      for (let i = 0; i < fn; i++) {
        const ang = _rand(seed + 111, i) * Math.PI * 2;
        const dst = ref.r * (0.15 + _rand(seed + 222, i) * 0.75);
        const fx  = (cx     + Math.cos(ang) * dst).toFixed(1);
        const fy  = (ref.cy + Math.sin(ang) * dst * 0.7).toFixed(1);
        g += `<circle cx="${fx}" cy="${fy}" r="1.8" fill="#f48fb1" opacity="0.82"/>`;
      }
    }

    // Nieve de invierno (gorro + copos)
    if (season === 'winter' && lvl >= 1) {
      const top = canopy[lvl].at(-1);
      g += `<ellipse cx="${cx}" cy="${top.cy - top.r * 0.45}" rx="${(top.r * 0.72).toFixed(1)}" ry="${(top.r * 0.28).toFixed(1)}" fill="rgba(255,255,255,0.70)"/>`;
      const base = canopy[lvl][0];
      for (let i = 0; i < 5; i++) {
        const ang = _rand(seed + 333, i) * Math.PI * 2;
        const dst = base.r * (0.12 + _rand(seed + 444, i) * 0.55);
        const fx  = (cx      + Math.cos(ang) * dst).toFixed(1);
        const fy  = (base.cy - base.r * 0.25 + Math.sin(ang) * dst * 0.45).toFixed(1);
        g += `<circle cx="${fx}" cy="${fy}" r="1.4" fill="rgba(255,255,255,0.55)"/>`;
      }
    }

    // Hojas caídas en otoño (pequeños puntos alrededor del tronco)
    if (season === 'autumn' && lvl >= 2) {
      const leafColors = ['#e65100','#ff8f00','#ffca28','#c62828','#ffa726'];
      for (let i = 0; i < 6; i++) {
        const lx = (cx - 14 + _rand(seed + 555, i) * 28).toFixed(1);
        const ly = (68 + _rand(seed + 666, i) * 8).toFixed(1);
        const lc = leafColors[i % leafColors.length];
        g += `<circle cx="${lx}" cy="${ly}" r="1.6" fill="${lc}" opacity="0.65"/>`;
      }
    }

    // Destello especular sutil en la copa superior
    const top = canopy[lvl].at(-1);
    g += `<circle cx="${cx - 1.5}" cy="${top.cy - 1.5}" r="${(top.r * 0.38).toFixed(1)}" fill="rgba(255,255,255,0.08)"/>`;
  }

  return g;
}

// ── Árbol completo como elemento <svg> ────────────────────────────────
function _svg(pomodoros, seed, w, season) {
  const h = Math.round(w * 83 / 60);
  const g = _svgInner(pomodoros, seed, w, season);
  return `<svg viewBox="0 -3 60 83" width="${w}" height="${h}" aria-hidden="true" style="overflow:visible;display:block">${g}</svg>`;
}

// ── Estado compartido para exportación ────────────────────────────────
let _lastWeekMap = {};
let _lastSeason  = 'summer';

// ── Exportación principal ─────────────────────────────────────────────

export function renderForest(sessions) {
  const el = document.getElementById('forest-container');
  if (!el) return;

  const wm     = _buildWeekMap(sessions || []);
  const season = _getSeason();
  _lastWeekMap = wm;
  _lastSeason  = season;

  const now = new Date();

  // Semana actual
  const currKey   = _weekKey(now);
  const currCount = wm[currKey] || 0;

  // 8 semanas anteriores (índice 0 = más antigua, 7 = más reciente)
  const past = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (8 - i) * 7);
    const k = _weekKey(d);
    return { key: k, count: wm[k] || 0, ago: 8 - i };
  });

  const currLbl = currCount === 0 ? 'Sin pomodoros aún'
                : currCount === 1 ? '1 🍅'
                : `${currCount} 🍅`;

  // Actualizar badge de estación en el encabezado
  const badge = document.getElementById('forest-season-badge');
  if (badge) {
    const SEASON_LABELS = { spring: '🌸 Primavera', summer: '☀️ Verano', autumn: '🍂 Otoño', winter: '❄️ Invierno' };
    badge.textContent = SEASON_LABELS[season] || '';
  }

  el.innerHTML = `
    <div class="forest-now">
      <div class="forest-now-glow">
        ${_svg(currCount, _dateSeed(currKey), 88, season)}
      </div>
      <div class="forest-now-lbl">Esta semana</div>
      <div class="forest-now-num">${currLbl}</div>
    </div>

    <div class="forest-sep"></div>

    <div class="forest-hist">
      ${past.map(w => {
        const op  = (0.35 + (1 - w.ago / 9) * 0.53).toFixed(2);
        const lbl = w.ago === 1 ? 'sem. ant.' : `-${w.ago}s`;
        const tip = w.ago === 1 ? 'Semana pasada' : `Hace ${w.ago} semanas`;
        return `
          <div class="forest-hist-tree" style="opacity:${op}" title="${tip}: ${w.count} 🍅">
            ${_svg(w.count, _dateSeed(w.key), 40, season)}
            <div class="forest-hist-num">${w.count > 0 ? w.count : '–'}</div>
          </div>`;
      }).join('')}
    </div>
  `;
}

// ── Exportar bosque como imagen PNG ──────────────────────────────────
export function exportForestImage() {
  const now    = new Date();
  const season = _lastSeason;
  const wm     = _lastWeekMap;

  const currKey = _weekKey(now);
  const past    = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (8 - i) * 7);
    const k = _weekKey(d);
    return { key: k, count: wm[k] || 0, ago: 8 - i };
  });
  const all = [...past, { key: currKey, count: wm[currKey] || 0, ago: 0 }];

  const W = 880, H = 260, PAD = 20;
  const tW = 76;
  const tH = Math.round(tW * 83 / 60);
  const spacing = (W - PAD * 2 - tW) / 8;

  let bodies = '';

  all.forEach((w, i) => {
    const x  = PAD + i * spacing;
    const y  = H - tH - 50;
    const op = w.ago === 0 ? 1 : (0.35 + (1 - w.ago / 9) * 0.53).toFixed(2);
    const lbl = w.ago === 0 ? 'Esta semana' : w.ago === 1 ? 'Sem. ant.' : `-${w.ago}s`;

    const inner = _svgInner(w.count, _dateSeed(w.key), tW, season);
    const scale = tW / 60;

    bodies += `<g transform="translate(${x},${y}) scale(${scale.toFixed(4)})" opacity="${op}">
      <svg viewBox="0 -3 60 83">${inner}</svg>
    </g>`;

    bodies += `<text x="${(x + tW / 2).toFixed(1)}" y="${H - 26}" text-anchor="middle"
      fill="rgba(184,216,230,0.55)" font-size="9" font-family="sans-serif,Arial">${lbl}</text>`;

    if (w.count > 0) {
      bodies += `<text x="${(x + tW / 2).toFixed(1)}" y="${H - 14}" text-anchor="middle"
        fill="#4ecdc4" font-size="10" font-weight="500" font-family="sans-serif,Arial">${w.count} 🍅</text>`;
    }
  });

  const ground = `<line x1="${PAD}" y1="${H - 44}" x2="${W - PAD}" y2="${H - 44}"
    stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;

  const SEASON_LABELS = { spring: '🌸 Primavera', summer: '☀️ Verano', autumn: '🍂 Otoño', winter: '❄️ Invierno' };
  const seasonLabel = SEASON_LABELS[season] || '';

  const title = `<text x="${W / 2}" y="22" text-anchor="middle"
    fill="rgba(232,244,248,0.7)" font-size="13" font-family="serif,Georgia"
    font-weight="500">🌲 Mi Bosque · ${seasonLabel}</text>`;

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#071020"/>
    ${title}
    ${ground}
    ${bodies}
  </svg>`;

  const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = () => {
    const canvas  = document.createElement('canvas');
    canvas.width  = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const a  = document.createElement('a');
    a.href   = canvas.toDataURL('image/png');
    a.download = `mi-bosque-${currKey}.png`;
    a.click();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    // Fallback: descargar el SVG directamente
    const a  = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = `mi-bosque-${currKey}.svg`;
    a.click();
  };
  img.src = url;
}
