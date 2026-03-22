/**
 * forest.js — Bosque de pomodoros.
 *
 * Cada semana es un árbol. Los pomodoros determinan su frondosidad.
 * Los árboles crecen de nivel 0 (tocón muerto) a nivel 5 (árbol centenario con frutos).
 * Se muestran 9 semanas: la actual (grande, centrada) + las 8 anteriores (pequeñas, de izquierda a derecha).
 */

// Pseudo-random determinista (seed + índice → 0..1)
function _rand(seed, i) {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000;
  return x - Math.floor(x);
}

// Devuelve la clave YYYY-MM-DD del lunes de la semana que contiene 'date'
function _weekKey(date) {
  const d   = new Date(date);
  const day = d.getDay();                      // 0=Dom … 6=Sáb
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// YYYY-MM-DD → número entero (seed para posición de frutos)
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

// ── Definición de capas de copa por nivel ─────────────────────────
// Espacio de coordenadas: viewBox "0 -3 60 83" (60px ancho, tronco nace en y=75)
const CANOPY = {
  1: [
    { cy: 54, r: 12,   c: '#43a047' },
    { cy: 43, r: 8.5,  c: '#66bb6a' },
  ],
  2: [
    { cy: 51, r: 14.5, c: '#388e3c' },
    { cy: 40, r: 11,   c: '#4caf50' },
    { cy: 30, r: 7.5,  c: '#81c784' },
  ],
  3: [
    { cy: 50, r: 16,   c: '#2e7d32' },
    { cy: 38, r: 12.5, c: '#388e3c' },
    { cy: 27, r: 9,    c: '#43a047' },
    { cy: 18, r: 5.5,  c: '#66bb6a' },
  ],
  4: [
    { cy: 50, r: 17,   c: '#1b5e20' },
    { cy: 36, r: 13.5, c: '#2e7d32' },
    { cy: 23, r: 9.5,  c: '#388e3c' },
    { cy: 13, r: 6,    c: '#43a047' },
    { cy: 5,  r: 3.5,  c: '#66bb6a' },
  ],
  5: [
    { cy: 50, r: 18,   c: '#1b5e20' },
    { cy: 35, r: 15,   c: '#2e7d32' },
    { cy: 22, r: 11,   c: '#33691e' },
    { cy: 11, r: 7.5,  c: '#388e3c' },
    { cy: 3,  r: 4.5,  c: '#43a047' },
  ],
};

const TRUNK_W = [0, 4, 5, 6, 7, 8];
const TRUNK_H = [0, 22, 25, 26, 27, 28];

// ── Generador SVG de árbol ────────────────────────────────────────
function _svg(pomodoros, seed, w) {
  const h   = Math.round(w * 83 / 60);
  const lvl = pomodoros === 0  ? 0
            : pomodoros <= 2   ? 1
            : pomodoros <= 5   ? 2
            : pomodoros <= 9   ? 3
            : pomodoros <= 14  ? 4 : 5;
  const cx  = 30;
  let   g   = '';

  if (lvl === 0) {
    // Tocón seco con dos ramas muertas
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

    // Tronco (ligeramente más ancho en la base)
    g += `<rect x="${cx - tw / 2 - 0.5}" y="${ty + 4}" width="${tw + 1}" height="${th - 4}" rx="2" fill="#4e342e"/>`;
    g += `<rect x="${cx - tw / 2}"       y="${ty}"     width="${tw}"     height="${th}"      rx="2" fill="#5d4037"/>`;

    // Capas de copa (de abajo hacia arriba)
    CANOPY[lvl].forEach(c => {
      g += `<circle cx="${cx}" cy="${c.cy}" r="${c.r}" fill="${c.c}"/>`;
    });

    // Frutos para árboles de alta productividad (niveles 4 y 5)
    if (lvl >= 4) {
      const ref  = CANOPY[lvl][1];                        // zona principal de frutos
      const fn   = lvl === 5 ? 9 : 5;
      const fc   = lvl === 5 ? '#c62828' : '#e64a19';
      for (let i = 0; i < fn; i++) {
        const ang = (i / fn) * Math.PI * 2 + _rand(seed, i) * 1.2;
        const dst = ref.r * (0.28 + _rand(seed, i + 77) * 0.58);
        const fx  = (cx     + Math.cos(ang) * dst).toFixed(1);
        const fy  = (ref.cy + Math.sin(ang) * dst * 0.78).toFixed(1);
        g += `<circle cx="${fx}" cy="${fy}" r="2.4" fill="${fc}"/>`;
      }
    }

    // Destello especular sutil en la copa superior
    const top = CANOPY[lvl].at(-1);
    g += `<circle cx="${cx - 1.5}" cy="${top.cy - 1.5}" r="${(top.r * 0.38).toFixed(1)}" fill="rgba(255,255,255,0.08)"/>`;
  }

  return `<svg viewBox="0 -3 60 83" width="${w}" height="${h}" aria-hidden="true" style="overflow:visible;display:block">${g}</svg>`;
}

// ── Exportación principal ─────────────────────────────────────────

export function renderForest(sessions) {
  const el = document.getElementById('forest-container');
  if (!el) return;

  const wm  = _buildWeekMap(sessions || []);
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

  el.innerHTML = `
    <div class="forest-now">
      <div class="forest-now-glow">
        ${_svg(currCount, _dateSeed(currKey), 88)}
      </div>
      <div class="forest-now-lbl">Esta semana</div>
      <div class="forest-now-num">${currLbl}</div>
    </div>

    <div class="forest-sep"></div>

    <div class="forest-hist">
      ${past.map(w => {
        // Opacidad: más antiguo = más tenue (0.35 → 0.88)
        const op  = (0.35 + (1 - w.ago / 9) * 0.53).toFixed(2);
        const lbl = w.ago === 1 ? 'sem. ant.' : `-${w.ago}s`;
        const tip = w.ago === 1 ? 'Semana pasada' : `Hace ${w.ago} semanas`;
        return `
          <div class="forest-hist-tree" style="opacity:${op}" title="${tip}: ${w.count} 🍅">
            ${_svg(w.count, _dateSeed(w.key), 40)}
            <div class="forest-hist-num">${w.count > 0 ? w.count : '–'}</div>
          </div>`;
      }).join('')}
    </div>
  `;
}
