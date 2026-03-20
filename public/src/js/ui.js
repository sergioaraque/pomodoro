/**
 * ui.js — Capa de presentación
 * Renderiza el DOM y maneja eventos del usuario.
 * No contiene lógica de negocio ni llamadas a la base de datos directamente.
 */

import { cfg } from './config.js';

const $ = id => document.getElementById(id);

// Nombres cortos para el mixer ambiental (evita importar settings-handler → circular)
const _MIX_LABELS = {
  ocean:'🌊 Mar', meadow:'🌿 Prado', mountain:'🏔️ Montaña', forest:'🌲 Bosque',
  desert:'🏜️ Desierto', city:'🌃 Ciudad', arctic:'❄️ Ártico', space:'🚀 Espacio',
  deep:'🌑 Abisal', volcano:'🌋 Volcán', rain:'🌧️ Lluvia', japan:'🏯 Japón',
  swamp:'🌿 Ciénaga', cave:'🐉 Cueva', underarctic:'🐋 Ártico sub.',
  savanna:'🌅 Sabana', alps:'🏔 Alpes', festival:'🎆 Festival', jungle:'🌺 Selva', mars:'🔭 Marte',
};
const _MIX_ALL_THEMES = Object.keys(_MIX_LABELS);

let _bannerMode  = null;
let _bannerTimer = null;

// Sugerencias de actividad para las pausas
const _SHORT_TIPS = [
  '☕ Levántate y sirve agua o un café.',
  '🧘 Cierra los ojos 60 segundos y respira hondo.',
  '👀 Mira por la ventana — descansa la vista.',
  '🤸 Estira cuello y hombros.',
  '💧 Bebe un vaso de agua.',
  '🚶 Date una vuelta corta por la habitación.',
  '🙆 Haz 10 rotaciones de hombros.',
  '📵 Aleja el teléfono — esto es un descanso de verdad.',
];
const _LONG_TIPS = [
  '🚶 Sal a caminar 10 minutos — activa el cuerpo.',
  '🍎 Come algo saludable — el cerebro necesita energía.',
  '🛁 Date un respiro completo: estira, hidratate y muévete.',
  '🎵 Pon tu canción favorita y desconecta.',
  '☀️ Sal fuera si puedes — la luz natural recarga.',
  '🗣️ Habla con alguien — salir del modo foco es sano.',
  '📖 Lee algo que no sea trabajo durante unos minutos.',
  '🧹 Ordena un rincón pequeño — despeja mente y espacio.',
];
function _randomTip(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ══════════════════════════════════════════════
//  AUTH UI
// ══════════════════════════════════════════════
export function showAuthError(msg) {
  $('auth-err').textContent = msg;
  $('auth-err').style.display = 'block';
  $('auth-ok').style.display  = 'none';
}

export function shakeAuthCard() {
  const card = document.querySelector('.auth-card');
  if (!card) return;
  card.classList.remove('auth-shake');
  void card.offsetWidth;
  card.classList.add('auth-shake');
  card.addEventListener('animationend', () => card.classList.remove('auth-shake'), { once: true });
}

export function showAuthSuccess(msg) {
  $('auth-ok').textContent = msg;
  $('auth-ok').style.display  = 'block';
  $('auth-err').style.display = 'none';
}

export function clearAuthMessages() {
  $('auth-err').style.display = 'none';
  $('auth-ok').style.display  = 'none';
}

export function switchAuthTab(tab) {
  clearAuthMessages();
  $('at-login').classList.toggle('active',    tab === 'login');
  $('at-register').classList.toggle('active', tab === 'register');
  $('auth-login-form').style.display    = tab === 'login'    ? 'block' : 'none';
  $('auth-register-form').style.display = tab === 'register' ? 'block' : 'none';
}

export function setAuthButtonLoading(btn, loading, defaultText) {
  const el = $(btn);
  el.disabled    = loading;
  el.textContent = loading ? '…' : defaultText;
}

// ══════════════════════════════════════════════
//  APP SHELL
// ══════════════════════════════════════════════
export function showApp(user) {
  const authEl = $('auth-screen');
  authEl.style.opacity = '0';
  authEl.style.transition = 'opacity 0.25s ease';
  setTimeout(() => { authEl.style.display = 'none'; }, 260);

  const topBar = $('top-bar');
  topBar.style.display = 'flex';
  requestAnimationFrame(() => { topBar.style.opacity = '1'; });

  const appEl = $('app-main');
  appEl.style.display = 'block';
  requestAnimationFrame(() => { appEl.style.opacity = '1'; });

  $('user-avatar').textContent    = user.email.charAt(0).toUpperCase();
  $('user-email-lbl').textContent = user.email;
}

export function hideApp() {
  const appEl = $('app-main');
  const topBar = $('top-bar');
  appEl.style.opacity  = '0';
  topBar.style.opacity = '0';
  appEl.style.display  = 'none';
  topBar.style.display = 'none';

  const authEl = $('auth-screen');
  authEl.style.display  = 'flex';
  authEl.style.opacity  = '0';
  authEl.style.transition = 'opacity 0.3s ease';
  requestAnimationFrame(() => { authEl.style.opacity = '1'; });
}

export function hideLoading() {}

// ══════════════════════════════════════════════
//  SYNC DOT
// ══════════════════════════════════════════════
export function setSyncState(state) {
  const dot = $('sync-dot');
  if (state === 'syncing') {
    dot.className = 'sync-dot syncing';
    dot.title     = 'Sincronizando…';
  } else if (state === 'ok') {
    dot.className = 'sync-dot';
    dot.title     = 'Sincronizado';
  } else {
    dot.className = 'sync-dot error';
    dot.title     = 'Error al sincronizar';
  }
}

// ══════════════════════════════════════════════
//  RESET UI
// ══════════════════════════════════════════════
export function resetUI() {
  const timerDisp = document.getElementById('timer-disp');
  if (timerDisp) timerDisp.textContent = '25:00';
  
  const pbar = document.getElementById('pbar');
  if (pbar) pbar.style.width = '100%';

  const modeLbl = document.getElementById('mode-lbl');
  if (modeLbl) modeLbl.textContent = 'Sesión de enfoque';
  
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.textContent = 'Iniciar';
  
  const tasksList = document.getElementById('tasks-list');
  if (tasksList) tasksList.innerHTML = '<div class="empty-msg">Cargando…</div>';
  
  const curTask = document.getElementById('cur-task-txt');
  if (curTask) curTask.textContent = 'Sin tarea seleccionada';
  
  const sdots = document.getElementById('sdots');
  if (sdots) sdots.innerHTML = '';
  
  const historyList = document.getElementById('history-list');
  if (historyList) historyList.innerHTML = '<div class="empty-msg">Sin sesiones aún</div>';
  
  const statIds = ['stat-total', 'stat-today', 'stat-streak', 'stat-hours'];
  statIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '0';
  });
  
  const goalRing = document.getElementById('goal-ring');
  if (goalRing) goalRing.innerHTML = '';
  
  // Resetear estado del banner para el próximo modo
  _bannerMode = null;
  clearTimeout(_bannerTimer);
  hideDeepFocusOverlay();
  // No aplicamos tema aquí; lo hará loadSettings() con el tema guardado del usuario.
  // El tema actual simplemente se mantiene hasta que cargue.
}

// ══════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════
export function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $('tab-' + name).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.tab === name) b.classList.add('active');
  });
}

// ══════════════════════════════════════════════
//  THEMES
// ══════════════════════════════════════════════
const THEMES = {
  ocean:    { title:'FocusSea',      subtitle:'Sumérgete en la concentración',  cls:'',                info:'<b>🌊 Mar</b> — Peces, medusas, algas y burbujas.' },
  meadow:   { title:'FocusMeadow',   subtitle:'Calma entre flores y brisa',     cls:'theme-meadow',    info:'<b>🌿 Prado</b> — Mariposas, abejas y flores.' },
  mountain: { title:'FocusPeak',     subtitle:'La claridad de las alturas',     cls:'theme-mountain',  info:'<b>🏔️ Montaña</b> — Águilas, nieve y pinos.' },
  forest:   { title:'FocusForest',   subtitle:'Quietud del bosque en la noche', cls:'theme-forest',    info:'<b>🌲 Bosque</b> — Luciérnagas, búho y árboles.' },
  desert:   { title:'FocusDesert',   subtitle:'Silencio ardiente del desierto', cls:'theme-desert',    info:'<b>🏜️ Desierto</b> — Cactus, escorpiones y remolinos.' },
  city:     { title:'FocusCity',     subtitle:'La ciudad que nunca duerme',     cls:'theme-city',      info:'<b>🌃 Ciudad</b> — Lluvia, coches y luces de neón.' },
  arctic:   { title:'FocusArctic',   subtitle:'Paz infinita bajo la aurora',    cls:'theme-arctic',    info:'<b>❄️ Ártico</b> — Auroras boreales, oso polar e icebergs.' },
  space:    { title:'FocusSpace',    subtitle:'Silencio cósmico, foco infinito',cls:'theme-space',     info:'<b>🚀 Espacio</b> — Planetas, satélites y nebulosas.' },
  deep:     { title:'FocusDeep',     subtitle:'Las profundidades del silencio', cls:'theme-deep',      info:'<b>🌑 Abisal</b> — Anglerfish, corales y bioluminiscencia.' },
  volcano:  { title:'FocusVolcano',  subtitle:'La energía del magma en ti',     cls:'theme-volcano',   info:'<b>🌋 Volcán</b> — Lava, rocas y cenizas en el aire.' },
  rain:     { title:'FocusRain',     subtitle:'La paz de la lluvia de otoño',   cls:'theme-rain',      info:'<b>🌧️ Lluvia</b> — Hojas, charcos y truenos lejanos.' },
  japan:    { title:'FocusZen',      subtitle:'La serenidad del jardín zen',    cls:'theme-japan',     info:'<b>🏯 Japón</b> — Cerezos, grullas y tori al amanecer.' },
  swamp:    { title:'FocusSwamp',    subtitle:'Calma misteriosa de la ciénaga', cls:'theme-swamp',     info:'<b>🌿 Ciénaga</b> — Ranas, nenúfares y fuegos fatuos.' },
  cave:     { title:'FocusCave',     subtitle:'Profundidad y silencio mineral', cls:'theme-cave',      info:'<b>🐉 Cueva</b> — Cristales, murciélagos y estalactitas.' },
  underarctic: { title:'FocusBelow', subtitle:'Bajo el hielo eterno',           cls:'theme-underarctic', info:'<b>🐋 Ártico sub.</b> — Belugas, focas y hielo polar.' },
  savanna:  { title:'FocusSavanna',  subtitle:'Horizontes infinitos africanos', cls:'theme-savanna',   info:'<b>🌅 Sabana</b> — Jirafas, acacias y atardecer africano.' },
  alps:     { title:'FocusAlps',     subtitle:'Aire limpio de las cumbres',     cls:'theme-alps',      info:'<b>🏔️ Alpes</b> — Vacas, edelweiss y cencerros.' },
  festival: { title:'FocusFest',     subtitle:'Celebra mientras te concentras', cls:'theme-festival',  info:'<b>🎆 Festival</b> — Farolillos, fuegos y multitud.' },
  jungle:   { title:'FocusJungle',   subtitle:'Energía salvaje de la selva',    cls:'theme-jungle',    info:'<b>🌺 Selva</b> — Tucanes, morpho azul y cascada.' },
  mars:     { title:'FocusMars',     subtitle:'El silencio rojo de Marte',      cls:'theme-mars',      info:'<b>🔭 Marte</b> — Rover, dunas y dos lunas.' },
};

export function applyTheme(name) {
  const t = THEMES[name];
  document.body.className = t.cls;

  ['ocean','meadow','mountain','forest','desert','city','arctic','space','deep','volcano','rain','japan','swamp','cave','underarctic','savanna','alps','festival','jungle','mars'].forEach(k => {
    const el = $('bg-' + k);
    if (el) el.style.opacity = (k === name) ? '1' : '0';
  });
  $('wave1').style.opacity     = (name === 'ocean' || name === 'deep') ? '1'  : '0';
  $('wave2').style.opacity     = (name === 'ocean' || name === 'deep') ? '.5' : '0';
  $('grass-svg').style.opacity = name === 'meadow' ? '1'  : '0';
  $('stars-canvas').style.opacity = (name === 'mountain' || name === 'forest' || name === 'arctic' || name === 'space' || name === 'japan' || name === 'festival' || name === 'mars') ? '1' : '0';

  $('app-title').textContent    = t.title;
  $('app-subtitle').textContent = t.subtitle;
  $('scene-info').innerHTML     = t.info;

  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  const tBtn = $('tbtn-' + name);
  if (tBtn) tBtn.classList.add('active');
}

export function getThemeSubtitle(name) {
  return THEMES[name]?.subtitle || '';
}

// ══════════════════════════════════════════════
//  TIMER UI
// ══════════════════════════════════════════════
const MODE_LABELS = {
  focus: 'Sesión de enfoque',
  short: 'Pausa corta',
  long:  'Pausa larga — descansa bien',
};

export function renderTimer(timerState) {
  const { mode, secondsLeft, totalSeconds, sessionsDone } = timerState;

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  $('timer-disp').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) : 1;
  $('pbar').style.width = (pct * 100) + '%';

  const disp = $('timer-disp');
  const pbar = $('pbar');
  disp.className = 'timer-display';
  pbar.className = 'pbar';

  const modeLblEl = $('mode-lbl');
  modeLblEl.textContent = MODE_LABELS[mode];
  modeLblEl.className   = 'mode-lbl mode-' + mode;

  if (mode === 'short') {
    disp.classList.add('break');
    pbar.classList.add('break');
  } else if (mode === 'long') {
    disp.classList.add('lbreak');
    pbar.classList.add('lbreak');
  }

  // Actualizar banner solo en cambio de modo, no en cada tick
  if (mode !== _bannerMode) {
    _bannerMode = mode;
    const banner = $('break-banner');
    clearTimeout(_bannerTimer);
    if (mode === 'short') {
      banner.textContent = `🌿 ¡Buen trabajo! ${_randomTip(_SHORT_TIPS)}`;
      banner.className   = 'break-banner visible';
      _bannerTimer = setTimeout(() => banner.classList.remove('visible'), 7000);
    } else if (mode === 'long') {
      banner.textContent = `🌊 ¡Ciclo completado! ${_randomTip(_LONG_TIPS)}`;
      banner.className   = 'break-banner lbreak visible';
      _bannerTimer = setTimeout(() => banner.classList.remove('visible'), 9000);
    } else {
      banner.classList.remove('visible');
    }
  }

  renderSessionDots(sessionsDone);
}

export function renderSessionDots(sessionsDone) {
  const container = $('sdots');
  container.innerHTML = '';
  const doneInCycle = sessionsDone % cfg.sessions;
  for (let i = 0; i < cfg.sessions; i++) {
    const d = document.createElement('div');
    d.className = 'sdot';
    if (i < doneInCycle)          d.classList.add('done');
    else if (i === doneInCycle)   d.classList.add('cur');
    container.appendChild(d);
  }
}

export function setStartButtonText(text) {
  $('start-btn').textContent = text;
}

export function setCurrentTaskBadge(name) {
  $('cur-task-txt').textContent = name || 'Sin tarea seleccionada';
}

// ══════════════════════════════════════════════
//  TASKS UI
// ══════════════════════════════════════════════
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function renderTasks(tasks, activeTaskId, handlers, recurringSet = new Set()) {
  const list = $('tasks-list');

  if (!tasks.length) {
    list.innerHTML = '<div class="empty-msg">Sin tareas aún — ¡añade una arriba!</div>';
    return;
  }

  list.innerHTML = tasks.map(t => {
    const hasNotes   = t.notes && t.notes.trim().length > 0;
    const est        = t.estimate || 0;
    const poms       = t.pomodoros || 0;
    const labelDef   = t.label ? cfg.labels.find(l => l.key === t.label) : null;
    const labelC     = labelDef ? labelDef.color : null;
    const timeMin    = poms * cfg.focus;
    const timeStr    = timeMin >= 60 ? `${(timeMin / 60).toFixed(1)}h` : `${timeMin}min`;
    const isRecurring = recurringSet.has(t.id);
    const pomStr     = est > 0
      ? `<div class="tpoms ${poms >= est ? 'done-est' : ''}" title="${timeStr} dedicados">🍅 ${poms}/${est}</div>`
      : poms > 0 ? `<div class="tpoms">🍅 ×${poms} <span class="tpoms-time">${timeStr}</span></div>` : '';
    return `
    <div class="task-item ${t.id === activeTaskId ? 'active-t' : ''} ${t.done ? 'done-t' : ''}"
         draggable="true"
         ondragstart="onTaskDragStart(event,'${t.id}')"
         ondragover="onTaskDragOver(event)"
         ondragenter="onTaskDragEnter(event)"
         ondragleave="onTaskDragLeave(event)"
         ondrop="onTaskDrop(event,'${t.id}')">
      <div class="task-item-row">
        <div class="drag-handle" title="Arrastrar">⠿</div>
        <div class="tchk ${t.done ? 'checked' : t.id === activeTaskId ? 'active-c' : ''}"
             data-action="toggle" data-id="${t.id}">
          ${t.done ? '✓' : ''}
        </div>
        ${labelC ? `<div class="task-label-dot" style="background:${labelC}" data-label="${t.label}" title="${labelDef.name}"></div>` : ''}
        <div class="tname ${t.done ? 'done' : ''}">${esc(t.name)}</div>
        ${pomStr}
        <button class="trecur ${isRecurring ? 'active' : ''}"
                data-action="toggle-recurring" data-id="${t.id}"
                title="${isRecurring ? 'Tarea recurrente — se reinicia cada día (clic para desactivar)' : 'Marcar como recurrente diaria'}">🔄</button>
        <button class="task-notes-toggle ${hasNotes ? 'has-notes' : ''}"
                data-action="toggle-notes" data-id="${t.id}"
                title="${hasNotes ? 'Ver/editar notas' : 'Añadir notas'}">📝</button>
        ${poms > 0 ? `<button class="task-hist-btn" onclick="loadTaskHistory('${t.id}',this)" title="Historial de sesiones">🕐</button>` : ''}
        ${!t.done ? `
          <button class="tfocus" data-action="focus" data-id="${t.id}">
            ${t.id === activeTaskId ? '✓ Activa' : 'Enfocar'}
          </button>` : ''}
        <button class="tdel" data-action="delete" data-id="${t.id}">✕</button>
      </div>
      <div class="task-hist-list" id="task-hist-${t.id}"></div>
      <div class="task-notes-area" id="notes-area-${t.id}">
        <textarea class="task-notes-input"
          data-action="notes-input" data-id="${t.id}"
          placeholder="Notas, enlaces, ideas…"
          rows="2">${esc(t.notes || '')}</textarea>
      </div>
    </div>`;
  }).join('');

  list.onclick = e => {
    const el     = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id     = el.dataset.id;
    if (action === 'focus')            handlers.onFocus(id);
    if (action === 'toggle')           handlers.onToggle(id);
    if (action === 'delete')           handlers.onDelete(id);
    if (action === 'toggle-recurring') handlers.onToggleRecurring?.(id);
    if (action === 'toggle-notes') {
      const area = $(`notes-area-${id}`);
      if (area) {
        area.classList.toggle('open');
        if (area.classList.contains('open')) area.querySelector('textarea')?.focus();
      }
    }
  };

  let notesTimer = null;
  list.oninput = e => {
    const ta = e.target.closest('[data-action="notes-input"]');
    if (!ta) return;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      handlers.onSaveNotes(ta.dataset.id, ta.value);
    }, 800);
  };
}

export function getTaskInputValue() {
  return $('task-inp').value.trim();
}
export function clearTaskInput() {
  $('task-inp').value = '';
}

// ══════════════════════════════════════════════
//  STATS UI
// ══════════════════════════════════════════════
export function renderStats({ total, today, streak, hours, bestStreak, bestDay, weekData, heatmapData, historyItems, dailyGoal, onDeleteHistory }) {
  $('stat-total').textContent  = total;
  $('stat-today').textContent  = today;
  $('stat-streak').textContent = streak;
  $('stat-hours').textContent  = hours;
  const bsEl = $('stat-best-streak'); if (bsEl) bsEl.textContent = bestStreak ?? 0;
  const bdEl = $('stat-best-day');    if (bdEl) bdEl.textContent = bestDay    ?? 0;

  _buildWeekChart(weekData);
  _buildHeatmap(heatmapData);
  _buildHistoryList(historyItems, onDeleteHistory);
}

export function renderAchievements(achievements, unlockedIds, newlyUnlocked = []) {
  const grid = $('achievements-grid');
  if (!grid) return;
  grid.innerHTML = achievements.map(a => {
    const isNew = newlyUnlocked.some(n => n.id === a.id);
    const cls   = `ach-badge${unlockedIds.has(a.id) ? ' unlocked' : ''}${isNew ? ' ach-new' : ''}`;
    return `<div class="${cls}" title="${a.desc}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    </div>`;
  }).join('');
}

function _buildWeekChart(counts) {
  const wrap = $('week-chart');
  wrap.innerHTML = '';
  const labels  = ['L','M','X','J','V','S','D'];
  const today   = new Date().getDay();
  const maxC    = Math.max(...counts, 1);

  counts.forEach((count, i) => {
    const daysAgo   = 6 - i;
    const dayOfWeek = ((today - daysAgo) % 7 + 7) % 7;
    const col = document.createElement('div');
    col.className = 'cbar-col';
    const h = Math.max(3, Math.round((count / maxC) * 74));
    col.innerHTML = `
      <div style="font-size:11px;color:var(--accent);min-height:15px">${count || ''}</div>
      <div class="cbar" style="height:${h}px"></div>
      <div class="cbar-lbl">${labels[(dayOfWeek + 6) % 7]}</div>`;
    wrap.appendChild(col);
  });
}

function _buildHeatmap(dayMap) {
  const wrap = $('heatmap');
  wrap.innerHTML = '';

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rangeStart = new Date(today); rangeStart.setDate(rangeStart.getDate() - 83);

  // Align to Monday of the week containing rangeStart
  const cur = new Date(rangeStart);
  cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));

  // Day labels column
  const labelsCol = document.createElement('div');
  labelsCol.className = 'hmap-day-labels';
  ['L','M','X','J','V','S','D'].forEach((d, i) => {
    const sp = document.createElement('span');
    sp.textContent = i % 2 === 1 ? d : '';
    labelsCol.appendChild(sp);
  });
  wrap.appendChild(labelsCol);

  // Weeks
  const weeksWrap = document.createElement('div');
  weeksWrap.className = 'hmap-weeks';
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  let lastMonth = -1;

  while (cur <= today) {
    const weekCol = document.createElement('div');
    weekCol.className = 'hmap-week-col';

    const mDiv = document.createElement('div');
    mDiv.className = 'hmap-month';
    const mo = cur.getMonth();
    if (mo !== lastMonth) { mDiv.textContent = MONTHS[mo]; lastMonth = mo; }
    weekCol.appendChild(mDiv);

    for (let d = 0; d < 7; d++) {
      const cell = document.createElement('div');
      if (cur < rangeStart || cur > today) {
        cell.className = 'hday hday-out';
      } else {
        const k = cur.toDateString();
        const v = dayMap[k] || 0;
        const lvl = v === 0 ? '' : v <= 1 ? 'l1' : v <= 3 ? 'l2' : v <= 5 ? 'l3' : 'l4';
        cell.className = ('hday ' + lvl).trim();
        const ds = cur.toLocaleDateString('es-ES', { day:'numeric', month:'short' });
        cell.setAttribute('data-tip', `${ds}: ${v} 🍅`);
      }
      weekCol.appendChild(cell);
      cur.setDate(cur.getDate() + 1);
    }
    weeksWrap.appendChild(weekCol);
  }
  wrap.appendChild(weeksWrap);
}

function _buildHistoryList(sessions, onDelete) {
  const list = $('history-list');
  if (!sessions.length) {
    list.innerHTML = '<div class="empty-msg">Sin sesiones aún</div>';
    return;
  }
  const ml = { focus:'Enfoque', short:'P. corta', long:'P. larga' };

  list.innerHTML = sessions.map(s => {
    const dt = new Date(s.completed_at);
    const ds = dt.toLocaleDateString('es-ES', { day:'numeric', month:'short' })
             + ' ' + dt.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
    return `<div class="hist-item">
      <div class="hist-badge ${s.mode}">${ml[s.mode] || s.mode}</div>
      <div class="hist-name">${s.task_name ? esc(s.task_name) : '<span style="color:var(--muted);font-style:italic">Sin tarea</span>'}</div>
      <div class="hist-time">${s.duration}min · ${ds}</div>
      <button class="hist-del" data-id="${s.id}" title="Eliminar">✕</button>
    </div>`;
  }).join('');

  list.onclick = e => {
    const btn = e.target.closest('.hist-del');
    if (btn) onDelete(btn.dataset.id);
  };
}

export function updateHistoryList(items, onDelete) {
  _buildHistoryList(items, onDelete);
}

// ══════════════════════════════════════════════
//  DAILY GOAL RING
// ══════════════════════════════════════════════
export function renderDailyGoalRing(done, goal) {
  const el = $('goal-ring');
  if (!el) return;
  const pct     = Math.min(done / goal, 1);
  const r       = 29;
  const circum  = 2 * Math.PI * r;
  const offset  = circum * (1 - pct);
  const color   = pct >= 1 ? '#ffa552' : 'var(--accent)';

  el.innerHTML = `
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r="${r}" fill="none"
        stroke="rgba(255,255,255,0.08)" stroke-width="5"/>
      <circle cx="38" cy="38" r="${r}" fill="none"
        stroke="${color}" stroke-width="5"
        stroke-linecap="round"
        stroke-dasharray="${circum}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 38 38)"
        style="transition: stroke-dashoffset 0.6s ease, stroke 0.4s"/>
      <text x="38" y="40" text-anchor="middle"
        fill="var(--text)" font-size="20" font-weight="700"
        font-family="var(--font-display)">${done}</text>
      <text x="38" y="52" text-anchor="middle"
        fill="var(--muted)" font-size="9">${goal > 0 ? `de ${goal}` : ''}</text>
    </svg>`;
}

export function showGoalAchieved() {
  const el = $('goal-achieved');
  if (!el) return;
  el.style.display = 'flex';
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; el.style.opacity = '1'; }, 600);
  }, 3500);
}

// ══════════════════════════════════════════════
//  DEEP FOCUS OVERLAY
// ══════════════════════════════════════════════
export function showDeepFocusOverlay(onExit) {
  let overlay = $('deep-focus-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'deep-focus-overlay';
    overlay.innerHTML = `<button class="df-exit-btn" id="df-exit-btn">Salir del foco profundo</button>`;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  setTimeout(() => overlay.style.opacity = '1', 10);
  $('df-exit-btn').onclick = onExit;
}

export function hideDeepFocusOverlay() {
  const overlay = $('deep-focus-overlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 400);
}

export function showStuckPrompt(taskName, count, onSplit) {
  const existing = $('stuck-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'stuck-modal';
  modal.className = 'stuck-overlay';
  const safe = taskName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  modal.innerHTML = `
    <div class="stuck-card">
      <div class="stuck-icon">🤔</div>
      <div class="stuck-title">¿Estás atascado?</div>
      <div class="stuck-msg">Llevas <b>${count} 🍅</b> seguidos en <b>"${safe}"</b> sin terminarla.</div>
      <div class="stuck-hint">Fragmenta en un paso concreto para desbloquear el avance.</div>
      <input type="text" class="stuck-input" placeholder="Siguiente paso concreto…" maxlength="120">
      <div class="stuck-actions">
        <button class="stuck-btn-split">Añadir subtarea</button>
        <button class="stuck-btn-skip">Continuar así</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const input     = modal.querySelector('.stuck-input');
  const splitBtn  = modal.querySelector('.stuck-btn-split');
  const skipBtn   = modal.querySelector('.stuck-btn-skip');

  function close() {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 280);
  }

  splitBtn.onclick = () => {
    const step = input.value.trim();
    if (!step) { input.focus(); input.classList.add('stuck-input-err'); return; }
    onSplit(step);
    close();
  };
  skipBtn.onclick = close;
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  input.addEventListener('input', () => input.classList.remove('stuck-input-err'));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') splitBtn.click(); if (e.key === 'Escape') close(); });

  requestAnimationFrame(() => { modal.style.opacity = '1'; });
  setTimeout(() => input.focus(), 80);
}

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
let _toastTimer = null;

/**
 * Muestra un toast con mensaje y opcionalmente un botón de acción.
 * @param {string} msg
 * @param {string} [actionLabel]
 * @param {Function} [actionFn]
 */
export function showToast(msg, actionLabel, actionFn) {
  let toast = $('fn-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fn-toast';
    toast.className = 'fn-toast';
    document.body.appendChild(toast);
  }
  clearTimeout(_toastTimer);
  toast.innerHTML = '<span class="fn-toast-msg"></span>' +
    (actionLabel ? `<button class="fn-toast-btn">${actionLabel}</button>` : '');
  toast.querySelector('.fn-toast-msg').textContent = msg;
  if (actionLabel && actionFn) {
    toast.querySelector('.fn-toast-btn').onclick = () => {
      actionFn();
      toast.classList.remove('fn-toast-show');
    };
  }
  toast.classList.add('fn-toast-show');
  _toastTimer = setTimeout(() => toast.classList.remove('fn-toast-show'), 4000);
}

export function renderSettings() {
  const focusEl    = $('sv-focus');
  const shortEl    = $('sv-short');
  const longEl     = $('sv-long');
  const sessionsEl = $('sv-sessions');
  const soundEl    = $('sw-sound');
  if (focusEl)    focusEl.textContent    = cfg.focus;
  if (shortEl)    shortEl.textContent    = cfg.short;
  if (longEl)     longEl.textContent     = cfg.long;
  if (sessionsEl) sessionsEl.textContent = cfg.sessions;
  if (soundEl)    soundEl.className      = 'sw' + (cfg.sound ? ' on' : '');

  const dgEl = $('sv-daily-goal');
  if (dgEl) dgEl.textContent = cfg.dailyGoal;

  const ambEl = $('sw-ambient');
  if (ambEl) ambEl.className = 'sw' + (cfg.ambient ? ' on' : '');
  const volWrap = $('ambient-vol-wrap');
  if (volWrap) volWrap.style.display = cfg.ambient ? 'flex' : 'none';
  const volSlider = $('ambient-vol-slider');
  if (volSlider) volSlider.value = cfg.ambientVol;

  const dfEl = $('sw-deepfocus');
  if (dfEl) dfEl.className = 'sw' + (cfg.deepFocus ? ' on' : '');

  const abEl = $('sw-autobreak');
  if (abEl) abEl.className = 'sw' + (cfg.autoBreak ? ' on' : '');

  const atEl = $('sw-autotheme');
  if (atEl) atEl.className = 'sw' + (cfg.autoTheme ? ' on' : '');

  const aaEl = $('sw-autoambient');
  if (aaEl) aaEl.className = 'sw' + (cfg.autoAmbient ? ' on' : '');

  const typingEl = $('sw-typing');
  if (typingEl) typingEl.className = 'sw' + (cfg.typingSounds ? ' on' : '');

  const apEl = $('sw-autopause');
  if (apEl) apEl.className = 'sw' + (cfg.autoPause ? ' on' : '');

  const ssEl = $('sound-style-sel');
  if (ssEl) ssEl.value = cfg.soundStyle || 'bells';

  renderLabelManager();
  renderTaskLabelSelect();

  // Renderizar mixer ambiental
  const mixWrap = $('ambient-mix-container');
  if (!mixWrap) return;
  if (!cfg.ambient) { mixWrap.innerHTML = ''; return; }

  const entries   = Object.entries(cfg.ambientMix || {});
  const usedThemes = entries.map(([t]) => t);
  const available  = _MIX_ALL_THEMES.filter(t => !usedThemes.includes(t));

  const rows = entries.map(([theme, vol]) => `
    <div class="mix-scene-row">
      <span class="mix-scene-name">${_MIX_LABELS[theme] || theme}</span>
      <input type="range" class="mix-vol-slider" min="0" max="1" step="0.05" value="${vol}"
        oninput="setMixSceneVol('${theme}', this.value)">
      <button class="mix-remove-btn" onclick="removeSceneFromMix('${theme}')" title="Quitar">×</button>
    </div>`).join('');

  const addRow = entries.length < 3 ? `
    <select class="mix-add-sel" onchange="addSceneToMix(this.value);this.value=''">
      <option value="">＋ Añadir escena…</option>
      ${available.map(t => `<option value="${t}">${_MIX_LABELS[t]}</option>`).join('')}
    </select>` : '';

  mixWrap.innerHTML = `<div class="mix-ambient-section">${rows}${addRow}</div>`;
}

export function renderHourChart(hourData) {
  const wrap = $('hour-chart');
  if (!wrap) return;
  wrap.innerHTML = '';
  const maxC = Math.max(...hourData, 1);
  hourData.forEach((count, h) => {
    const col = document.createElement('div');
    col.className = 'cbar-col';
    const height = Math.max(2, Math.round((count / maxC) * 74));
    const lbl = h % 6 === 0 ? `${h}h` : '';
    col.innerHTML =
      `<div style="font-size:9px;color:var(--accent);min-height:13px">${count || ''}</div>` +
      `<div class="cbar" style="height:${height}px;opacity:${count ? 0.85 : 0.15}"></div>` +
      `<div class="cbar-lbl">${lbl}</div>`;
    wrap.appendChild(col);
  });
}

// ══════════════════════════════════════════════
//  STREAK BADGE (timer tab)
// ══════════════════════════════════════════════
export function updateStreakBadge(streak) {
  const badge = $('streak-mini');
  const val   = $('streak-mini-val');
  const sep   = $('thud-sep');
  const hud   = document.querySelector('.timer-hud');
  if (!badge || !val) return;
  if (streak > 0) {
    val.textContent     = streak;
    badge.style.display = 'flex';
    if (sep) sep.style.display = 'block';
    if (hud) hud.classList.add('timer-hud--wide');
  } else {
    badge.style.display = 'none';
    if (sep) sep.style.display = 'none';
    if (hud) hud.classList.remove('timer-hud--wide');
  }
}

// ══════════════════════════════════════════════
//  WEEKLY REVIEW MODAL
// ══════════════════════════════════════════════
export function showWeeklyReview({ dateRange, thisTotal, lastTotal, pctChange, hours, streak, dayCounts, dayNames, bestDayName, topTasks }) {
  const modal = $('weekly-review-modal');
  if (!modal) return;

  // Hero delta
  let deltaHtml = '';
  if (pctChange !== null) {
    const dir  = pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'same';
    const sign = pctChange > 0 ? '+' : '';
    deltaHtml  = `<div class="wr-stat-delta ${dir}">${sign}${pctChange}% vs semana anterior</div>`;
  } else if (thisTotal > 0) {
    deltaHtml = `<div class="wr-stat-delta up">Primera semana 🌱</div>`;
  }

  // Day bar chart
  const maxDay  = Math.max(...dayCounts, 1);
  const todayDI = (new Date().getDay() + 6) % 7; // 0=Lun
  const dayChart = dayNames.map((lbl, i) => {
    const h   = Math.max(2, Math.round((dayCounts[i] / maxDay) * 44));
    const hi  = i === todayDI;
    return `<div class="wr-day-col">
      <div class="wr-day-bar" style="height:${h}px${hi ? ';opacity:1' : ''}"></div>
      <div class="wr-day-lbl" style="${hi ? 'color:var(--accent)' : ''}">${lbl}</div>
    </div>`;
  }).join('');

  // Top tasks
  const medals   = ['🥇','🥈','🥉','4.','5.'];
  const taskHtml = topTasks.length
    ? topTasks.map(([name, count], i) =>
        `<div class="wr-task-row">
          <span class="wr-task-rank">${medals[i]}</span>
          <span class="wr-task-name">${name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</span>
          <span class="wr-task-poms">${count} 🍅</span>
        </div>`).join('')
    : '<div style="font-size:12px;color:var(--muted)">Sin tareas registradas esta semana</div>';

  // Motivational message
  const msgs = [
    ['🌱', 'Cada inicio es valioso. ¡El hábito se construye así!'],
    ['💪', '¡Buena semana! La constancia es la clave del éxito.'],
    ['🔥', '¡Gran semana! Estás en modo fuego — sigue así.'],
    ['🏆', '¡Semana excepcional! Eres una máquina de enfoque.'],
  ];
  const tier = thisTotal === 0 ? 0 : thisTotal < 10 ? 1 : thisTotal < 20 ? 2 : 3;
  const [mIcon, mText] = msgs[tier];

  const card = modal.querySelector('.wr-card');
  card.innerHTML = `
    <div class="wr-header">
      <div>
        <div class="wr-title">📊 Resumen semanal</div>
        <div class="wr-dates">${dateRange}</div>
      </div>
      <button class="wr-close" onclick="document.getElementById('weekly-review-modal').classList.remove('open')">✕</button>
    </div>

    <div class="wr-hero">
      <div class="wr-stat">
        <div class="wr-stat-val">${thisTotal}</div>
        <div class="wr-stat-lbl">Pomodoros</div>
        ${deltaHtml}
      </div>
      <div class="wr-stat">
        <div class="wr-stat-val">${hours}</div>
        <div class="wr-stat-lbl">Horas enfocado</div>
      </div>
      <div class="wr-stat">
        <div class="wr-stat-val">${streak > 0 ? '🔥' + streak : '—'}</div>
        <div class="wr-stat-lbl">Días de racha</div>
      </div>
    </div>

    <div class="wr-section">
      <div class="wr-section-title">Distribución de la semana</div>
      <div class="wr-day-chart">${dayChart}</div>
    </div>

    <div class="wr-section">
      <div class="wr-section-title">Tareas más trabajadas</div>
      ${taskHtml}
    </div>

    ${bestDayName ? `<div style="font-size:12px;color:var(--muted);margin-bottom:14px">
      📅 Mejor día: <b style="color:var(--text)">${bestDayName}</b>
      con <b style="color:var(--accent)">${Math.max(...dayCounts)} 🍅</b>
    </div>` : ''}

    <div class="wr-motivation">${mIcon} ${mText}</div>
    <button class="wr-btn" onclick="document.getElementById('weekly-review-modal').classList.remove('open')">¡A seguir! 💪</button>`;

  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.onclick = e => { if (e.target === modal) modal.classList.remove('open'); };
}

export function renderLabelStats(data) {
  const el = $('label-stats');
  if (!el) return;
  if (!data || !Object.keys(data).length) {
    el.innerHTML = '<div class="empty-msg" style="font-size:12px">Sin datos de etiquetas por tarea activa aún.</div>';
    return;
  }
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  el.innerHTML = Object.entries(data).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
    const def   = cfg.labels.find(l => l.key === k);
    const color = def ? def.color : 'var(--accent)';
    const name  = def ? def.name : k;
    const pct   = Math.round(v / total * 100);
    return `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span style="color:${color}">${name}</span>
        <span style="color:var(--muted)">${v} 🍅 · ${pct}%</span>
      </div>
      <div style="height:4px;border-radius:2px;background:rgba(255,255,255,.08)">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;transition:width .6s ease"></div>
      </div>
    </div>`;
  }).join('');
}

export function renderTaskLabelSelect() {
  const sel = $('task-label-sel');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Sin etiqueta</option>' +
    cfg.labels.map(l => `<option value="${l.key}">${l.name}</option>`).join('');
  if (current) sel.value = current;
}

export function renderLabelManager() {
  const el = $('label-manager');
  if (!el) return;
  const rows = cfg.labels.map(l => `
    <div class="lm-row">
      <label class="lm-swatch" style="background:${l.color}" title="Cambiar color">
        <input type="color" value="${l.color}"
          oninput="this.parentElement.style.background=this.value; updateLabelColor('${l.key}',this.value)">
      </label>
      <span class="lm-name">${l.name}</span>
      <button class="lm-del" onclick="deleteLabel('${l.key}')" title="Eliminar">×</button>
    </div>`).join('');

  el.innerHTML = rows + `
    <div class="lm-add-row">
      <input class="lm-add-inp" id="lm-add-name" placeholder="Nueva etiqueta…" maxlength="24"
             onkeydown="if(event.key==='Enter')addLabel()">
      <label class="lm-add-swatch" id="lm-add-swatch" style="background:#a0a0f0" title="Color">
        <input type="color" value="#a0a0f0"
          oninput="this.parentElement.style.background=this.value">
      </label>
      <button class="lm-add-btn" onclick="addLabel()">+</button>
    </div>`;
}