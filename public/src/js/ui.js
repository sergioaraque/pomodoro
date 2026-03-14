/**
 * ui.js — Capa de presentación
 * Renderiza el DOM y maneja eventos del usuario.
 * No contiene lógica de negocio ni llamadas a Supabase directamente.
 */

import { cfg } from './config.js';

const $ = id => document.getElementById(id);

// ══════════════════════════════════════════════
//  AUTH UI
// ══════════════════════════════════════════════
export function showAuthError(msg) {
  $('auth-err').textContent = msg;
  $('auth-err').style.display = 'block';
  $('auth-ok').style.display  = 'none';
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
  $('auth-screen').style.display = 'none';
  $('top-bar').style.display     = 'flex';
  $('app-main').style.display    = 'block';
  $('user-avatar').textContent   = user.email.charAt(0).toUpperCase();
  $('user-email-lbl').textContent = user.email;
}

export function hideApp() {
  $('auth-screen').style.display = 'flex';
  $('top-bar').style.display     = 'none';
  $('app-main').style.display    = 'none';
}

export function hideLoading() {
  const ls = $('loading-screen');
  ls.style.opacity = '0';
  setTimeout(() => ls.style.display = 'none', 500);
}

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
//  TABS
// ══════════════════════════════════════════════
export function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $('tab-' + name).classList.add('active');
  // Highlight the clicked button
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.tab === name) b.classList.add('active');
  });
}

// ══════════════════════════════════════════════
//  THEMES
// ══════════════════════════════════════════════
const THEMES = {
  ocean:    { title:'FocusSea',      subtitle:'Sumérgete en la concentración',  cls:'',               info:'<b>🌊 Mar</b> — Peces, medusas, algas y burbujas.' },
  meadow:   { title:'FocusMeadow',   subtitle:'Calma entre flores y brisa',     cls:'theme-meadow',   info:'<b>🌿 Prado</b> — Mariposas, abejas y flores.' },
  mountain: { title:'FocusPeak',     subtitle:'La claridad de las alturas',     cls:'theme-mountain', info:'<b>🏔️ Montaña</b> — Águilas, nieve y pinos.' },
  forest:   { title:'FocusForest',   subtitle:'Quietud del bosque en la noche', cls:'theme-forest',   info:'<b>🌲 Bosque</b> — Luciérnagas, búho y árboles.' },
};

export function applyTheme(name) {
  const t = THEMES[name];
  document.body.className = t.cls;

  ['ocean','meadow','mountain','forest'].forEach(k => {
    $('bg-' + k).style.opacity = (k === name) ? '1' : '0';
  });
  $('wave1').style.opacity     = name === 'ocean'   ? '1'  : '0';
  $('wave2').style.opacity     = name === 'ocean'   ? '.5' : '0';
  $('grass-svg').style.opacity = name === 'meadow'  ? '1'  : '0';
  $('stars-canvas').style.opacity = (name === 'mountain' || name === 'forest') ? '1' : '0';

  $('app-title').textContent    = t.title;
  $('app-subtitle').textContent = t.subtitle;
  $('scene-info').innerHTML     = t.info;

  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  $('tbtn-' + name).classList.add('active');
}

// ══════════════════════════════════════════════
//  TIMER UI
// ══════════════════════════════════════════════
const MODE_LABELS = {
  focus: 'Sesión de enfoque',
  short: 'Pausa corta',
  long:  'Pausa larga — descansa bien',
};

/**
 * Actualiza toda la UI del temporizador a partir del estado del timer.
 * @param {{ mode, secondsLeft, totalSeconds, sessionsDone }} timerState
 */
export function renderTimer(timerState) {
  const { mode, secondsLeft, totalSeconds, sessionsDone } = timerState;

  // Display
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  $('timer-disp').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  // Progress bar
  const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds * 100) : 0;
  $('pbar').style.width = pct + '%';

  // Mode classes
  const disp = $('timer-disp');
  const pbar = $('pbar');
  disp.className = 'timer-display';
  pbar.className = 'pbar';

  $('mode-lbl').textContent = MODE_LABELS[mode];

  if (mode === 'short') {
    disp.classList.add('break');
    pbar.classList.add('break');
  } else if (mode === 'long') {
    disp.classList.add('lbreak');
    pbar.classList.add('lbreak');
  }

  // Break notification banner
  const banner = $('break-banner');
  if (mode === 'short') {
    banner.textContent = '🌿 ¡Buen trabajo! Tómate una pausa corta.';
    banner.className   = 'break-banner visible';
    setTimeout(() => banner.classList.remove('visible'), 6000);
  } else if (mode === 'long') {
    banner.textContent = '🌊 ¡Ciclo completado! Disfruta tu descanso largo.';
    banner.className   = 'break-banner lbreak visible';
    setTimeout(() => banner.classList.remove('visible'), 8000);
  } else {
    banner.classList.remove('visible');
  }

  // Session dots
  renderSessionDots(sessionsDone);
}

export function renderSessionDots(sessionsDone) {
  const container = $('sdots');
  container.innerHTML = '';
  const doneInCycle = sessionsDone % cfg.sessions;
  for (let i = 0; i < cfg.sessions; i++) {
    const d = document.createElement('div');
    d.className = 'sdot';
    if (i < doneInCycle) d.classList.add('done');
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

/**
 * @param {Array}       tasks
 * @param {string|null} activeTaskId
 * @param {{ onFocus, onToggle, onDelete }} handlers
 */
export function renderTasks(tasks, activeTaskId, handlers) {
  const list = $('tasks-list');

  if (!tasks.length) {
    list.innerHTML = '<div class="empty-msg">Sin tareas aún — ¡añade una arriba!</div>';
    return;
  }

  list.innerHTML = tasks.map(t => {
    const hasNotes = t.notes && t.notes.trim().length > 0;
    return `
    <div class="task-item ${t.id === activeTaskId ? 'active-t' : ''} ${t.done ? 'done-t' : ''}">
      <div class="task-item-row">
        <div class="tchk ${t.done ? 'checked' : t.id === activeTaskId ? 'active-c' : ''}"
             data-action="toggle" data-id="${t.id}">
          ${t.done ? '✓' : ''}
        </div>
        <div class="tname ${t.done ? 'done' : ''}">${esc(t.name)}</div>
        ${t.pomodoros > 0 ? `<div class="tpoms">🍅 ×${t.pomodoros}</div>` : ''}
        <button class="task-notes-toggle ${hasNotes ? 'has-notes' : ''}"
                data-action="toggle-notes" data-id="${t.id}"
                title="${hasNotes ? 'Ver/editar notas' : 'Añadir notas'}">📝</button>
        ${!t.done ? `
          <button class="tfocus" data-action="focus" data-id="${t.id}">
            ${t.id === activeTaskId ? '✓ Activa' : 'Enfocar'}
          </button>` : ''}
        <button class="tdel" data-action="delete" data-id="${t.id}">✕</button>
      </div>
      <div class="task-notes-area" id="notes-area-${t.id}">
        <textarea class="task-notes-input"
          data-action="notes-input" data-id="${t.id}"
          placeholder="Notas, enlaces, ideas…"
          rows="2">${esc(t.notes || '')}</textarea>
      </div>
    </div>`;
  }).join('');

  // Delegated events — un solo listener para toda la lista
  list.onclick = e => {
    const el     = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id     = el.dataset.id;
    if (action === 'focus')        handlers.onFocus(id);
    if (action === 'toggle')       handlers.onToggle(id);
    if (action === 'delete')       handlers.onDelete(id);
    if (action === 'toggle-notes') {
      const area = $(`notes-area-${id}`);
      if (area) {
        area.classList.toggle('open');
        if (area.classList.contains('open')) area.querySelector('textarea')?.focus();
      }
    }
  };

  // Save notes on blur (debounced)
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
//  SETTINGS UI (extendido — ver al final del archivo)
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
//  STATS UI
// ══════════════════════════════════════════════
export function renderStats({ total, today, streak, hours, weekData, heatmapData, historyItems, dailyGoal, onDeleteHistory }) {
  $('stat-total').textContent  = total;
  $('stat-today').textContent  = today;
  $('stat-streak').textContent = streak;
  $('stat-hours').textContent  = hours;

  _buildWeekChart(weekData);
  _buildHeatmap(heatmapData);
  _buildHistoryList(historyItems, onDeleteHistory);
}

function _buildWeekChart(counts) {
  const wrap = $('week-chart');
  wrap.innerHTML = '';
  const labels  = ['L','M','X','J','V','S','D'];
  const today   = new Date().getDay(); // 0=Sun
  const maxC    = Math.max(...counts, 1);

  counts.forEach((count, i) => {
    // i=0 → 6 days ago, i=6 → today
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
  for (let i = 83; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const k = d.toDateString();
    const v = dayMap[k] || 0;
    const lvl = v === 0 ? '' : v <= 1 ? 'l1' : v <= 3 ? 'l2' : v <= 5 ? 'l3' : 'l4';
    const el  = document.createElement('div');
    el.className = 'hday ' + lvl;
    const ds = d.toLocaleDateString('es-ES', { day:'numeric', month:'short' });
    el.setAttribute('data-tip', `${ds}: ${v} pomodoro${v !== 1 ? 's' : ''}`);
    wrap.appendChild(el);
  }
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

// ══════════════════════════════════════════════
//  DAILY GOAL RING
// ══════════════════════════════════════════════
export function renderDailyGoalRing(done, goal) {
  const el = $('goal-ring');
  if (!el) return;
  const pct     = Math.min(done / goal, 1);
  const r       = 36;
  const circum  = 2 * Math.PI * r;
  const offset  = circum * (1 - pct);
  const color   = pct >= 1 ? '#ffa552' : 'var(--accent)';

  el.innerHTML = `
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r="${r}" fill="none"
        stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
      <circle cx="45" cy="45" r="${r}" fill="none"
        stroke="${color}" stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray="${circum}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 45 45)"
        style="transition: stroke-dashoffset 0.6s ease, stroke 0.4s"/>
      <text x="45" y="41" text-anchor="middle"
        fill="var(--text)" font-size="15" font-weight="600"
        font-family="var(--font-display)">${done}</text>
      <text x="45" y="56" text-anchor="middle"
        fill="var(--muted)" font-size="10">${goal > 0 ? `/ ${goal}` : ''}</text>
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

// ══════════════════════════════════════════════
//  SETTINGS — new fields
// ══════════════════════════════════════════════
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

  // Daily goal
  const dgEl = $('sv-daily-goal');
  if (dgEl) dgEl.textContent = cfg.dailyGoal;

  // Ambient
  const ambEl = $('sw-ambient');
  if (ambEl) ambEl.className = 'sw' + (cfg.ambient ? ' on' : '');
  const volWrap = $('ambient-vol-wrap');
  if (volWrap) volWrap.style.display = cfg.ambient ? 'flex' : 'none';
  const volSlider = $('ambient-vol-slider');
  if (volSlider) volSlider.value = cfg.ambientVol;

  // Deep focus
  const dfEl = $('sw-deepfocus');
  if (dfEl) dfEl.className = 'sw' + (cfg.deepFocus ? ' on' : '');
}
