/**
 * app.js — Punto de entrada principal
 *
 * Nuevas funcionalidades v2:
 *   🎵 Música ambiental generativa por tema (Web Audio API)
 *   🎯 Objetivo diario con anillo de progreso SVG
 *   📝 Notas por tarea (expandibles, sincronizadas)
 *   🌑 Modo foco profundo (atenúa UI, bloquea distracciones)
 */

import { cfg }                                               from './config.js';
import * as db                                               from './db.js';
import { initTimer, toggleTimer, resetTimer, skipSession,
         setMode, setTask, clearTask, getState }             from './timer.js';
import * as ui                                               from './ui.js';
import { playSessionEnd }                                    from './sound.js';
import { spawnCreatures, drawStars }                         from './creatures.js';
import { initAmbient, startAmbient, stopAmbient,
         setVolume, getVolume, isPlaying }                   from './ambient.js';

// ─── SUPABASE ─────────────────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON__);
db.initDb(sb);
initAmbient();

// ─── APP STATE ────────────────────────────────────────────────────────
let currentUser  = null;
let tasks        = [];
let activeTaskId = null;
let currentTheme = 'ocean';
let saveTimer    = null;
let todayCount   = 0;   // pomodoros completados hoy (se actualiza en onEnd)

// ══════════════════════════════════════════════════════════════════════
//  TIMER — callbacks
// ══════════════════════════════════════════════════════════════════════
initTimer({
  onTick: (state) => {
    ui.renderTimer(state);
    ui.setStartButtonText(
      state.running
        ? 'Pausar'
        : (state.secondsLeft < state.totalSeconds ? 'Reanudar' : 'Iniciar')
    );
  },

  onEnd: async (finishedMode, durationMin, taskId, taskName) => {
    playSessionEnd();

    // Guardar en BD
    if (currentUser) {
      ui.setSyncState('syncing');
      const { error } = await db.sessions.create(
        currentUser.id, finishedMode, durationMin, taskId, taskName
      );
      ui.setSyncState(error ? 'error' : 'ok');
    }

    // Incrementar tarea
    if (finishedMode === 'focus' && taskId) {
      const t = tasks.find(t => t.id === taskId);
      if (t) {
        t.pomodoros++;
        renderTasks();
        if (currentUser) await db.tasks.update(taskId, { pomodoros: t.pomodoros });
      }
    }

    // Actualizar objetivo diario
    if (finishedMode === 'focus') {
      todayCount++;
      ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
      // Celebración si se alcanza el objetivo
      if (todayCount === cfg.dailyGoal) {
        ui.showGoalAchieved();
      }
    }

    // Si estaba en modo foco profundo y empieza pausa → salir del modo
    if (cfg.deepFocus && finishedMode === 'focus') {
      // Mantener deep focus durante la pausa — es decisión del usuario salir
    }

    ui.setStartButtonText('Iniciar');
  },
});

// ══════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════
async function handleLogin(user) {
  currentUser = user;
  ui.showApp(user);
  await loadSettings();
  await loadTasks();
  await _loadTodayCount();
  spawnCreatures(currentTheme);
  drawStars();
  ui.renderTimer(getState());
  ui.renderSessionDots(getState().sessionsDone);
  ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
  ui.setStartButtonText('Iniciar');
  ui.hideLoading();
}

function handleLogout() {
  currentUser  = null;
  tasks        = [];
  activeTaskId = null;
  todayCount   = 0;
  stopAmbient();
  if (cfg.deepFocus) _exitDeepFocus();
  ui.hideApp();
  ui.clearAuthMessages();
  ui.setCurrentTaskBadge(null);
  ui.renderTasks([], null, taskHandlers);
}

window.doLogin = async () => {
  const email = document.getElementById('li-email').value.trim();
  const pass  = document.getElementById('li-pass').value;
  if (!email || !pass) return ui.showAuthError('Rellena todos los campos.');
  ui.setAuthButtonLoading('li-btn', true, 'Entrar');
  const { error } = await db.auth.signIn(email, pass);
  ui.setAuthButtonLoading('li-btn', false, 'Entrar');
  if (error) ui.showAuthError(
    error.message.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message
  );
};

window.doRegister = async () => {
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if (!email || !pass) return ui.showAuthError('Rellena todos los campos.');
  if (pass.length < 6) return ui.showAuthError('La contraseña debe tener al menos 6 caracteres.');
  ui.setAuthButtonLoading('reg-btn', true, 'Crear cuenta');
  const { error } = await db.auth.signUp(email, pass);
  ui.setAuthButtonLoading('reg-btn', false, 'Crear cuenta');
  if (error) ui.showAuthError(error.message);
  else ui.showAuthSuccess('¡Cuenta creada! Revisa tu correo y luego inicia sesión.');
};

window.doLogout = async () => {
  await db.auth.signOut();
};

window.showAuthTab = ui.switchAuthTab;

// ══════════════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════════════
async function loadSettings() {
  const { data } = await db.settings.load(currentUser.id);
  if (data) {
    cfg.focus      = data.focus_min;
    cfg.short      = data.short_min;
    cfg.long       = data.long_min;
    cfg.sessions   = data.sessions;
    cfg.sound      = data.sound;
    cfg.dailyGoal  = data.daily_goal  ?? 8;
    cfg.ambient    = data.ambient     ?? false;
    cfg.ambientVol = data.ambient_vol ?? 0.4;
    cfg.deepFocus  = data.deep_focus  ?? false;
    applyTheme(data.theme || 'ocean', false);
    if (cfg.ambient) startAmbient(currentTheme);
    setVolume(cfg.ambientVol);
  }
  setMode('focus');
  ui.renderSettings();
  ui.renderSessionDots(getState().sessionsDone);
}

async function saveSettings() {
  if (!currentUser) return;
  ui.setSyncState('syncing');
  const { error } = await db.settings.save(currentUser.id, {
    focus_min:   cfg.focus,
    short_min:   cfg.short,
    long_min:    cfg.long,
    sessions:    cfg.sessions,
    sound:       cfg.sound,
    theme:       currentTheme,
    daily_goal:  cfg.dailyGoal,
    ambient:     cfg.ambient,
    ambient_vol: cfg.ambientVol,
    deep_focus:  cfg.deepFocus,
  });
  ui.setSyncState(error ? 'error' : 'ok');
}

function debounceSaveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 700);
}

const SETTING_LIMITS = {
  focus:[5,90], short:[1,30], long:[5,60], sessions:[2,8], dailyGoal:[1,20]
};

window.adjSetting = (key, delta) => {
  const [min, max] = SETTING_LIMITS[key];
  cfg[key] = Math.max(min, Math.min(max, cfg[key] + delta));
  ui.renderSettings();
  if (key !== 'dailyGoal') setMode(getState().mode);
  ui.renderSessionDots(getState().sessionsDone);
  ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
  debounceSaveSettings();
};

window.toggleSound = () => {
  cfg.sound = !cfg.sound;
  ui.renderSettings();
  debounceSaveSettings();
};

// ── Música ambiental ──────────────────────────────────────────────────
window.toggleAmbient = () => {
  cfg.ambient = !cfg.ambient;
  if (cfg.ambient) startAmbient(currentTheme);
  else             stopAmbient();
  ui.renderSettings();
  debounceSaveSettings();
};

window.setAmbientVolume = (v) => {
  cfg.ambientVol = parseFloat(v);
  setVolume(cfg.ambientVol);
  debounceSaveSettings();
};

// ── Modo foco profundo ────────────────────────────────────────────────
window.toggleDeepFocus = () => {
  cfg.deepFocus = !cfg.deepFocus;
  if (cfg.deepFocus) _enterDeepFocus();
  else               _exitDeepFocus();
  ui.renderSettings();
  debounceSaveSettings();
};

function _enterDeepFocus() {
  document.body.classList.add('deep-focus');
  // Mostrar overlay con botón para salir
  ui.showDeepFocusOverlay(() => {
    cfg.deepFocus = false;
    _exitDeepFocus();
    ui.renderSettings();
    debounceSaveSettings();
  });
}

function _exitDeepFocus() {
  document.body.classList.remove('deep-focus');
  ui.hideDeepFocusOverlay();
}

// ══════════════════════════════════════════════════════════════════════
//  TASKS
// ══════════════════════════════════════════════════════════════════════
async function loadTasks() {
  const { data } = await db.tasks.loadAll(currentUser.id);
  if (data) tasks = data;
  renderTasks();
}

function renderTasks() {
  ui.renderTasks(tasks, activeTaskId, taskHandlers);
}

const taskHandlers = {
  onFocus: (id) => {
    activeTaskId = id;
    const t = tasks.find(t => t.id === id);
    setTask(id, t?.name || null);
    ui.setCurrentTaskBadge(t?.name);
    renderTasks();
  },
  onToggle: async (id) => {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.done = !t.done;
    if (t.done && activeTaskId === id) {
      activeTaskId = null;
      clearTask();
      ui.setCurrentTaskBadge(null);
    }
    renderTasks();
    if (currentUser) {
      ui.setSyncState('syncing');
      const { error } = await db.tasks.update(id, { done: t.done });
      ui.setSyncState(error ? 'error' : 'ok');
    }
  },
  onDelete: async (id) => {
    tasks = tasks.filter(t => t.id !== id);
    if (activeTaskId === id) {
      activeTaskId = null;
      clearTask();
      ui.setCurrentTaskBadge(null);
    }
    renderTasks();
    if (currentUser) {
      ui.setSyncState('syncing');
      const { error } = await db.tasks.remove(id);
      ui.setSyncState(error ? 'error' : 'ok');
    }
  },
  onSaveNotes: async (id, notes) => {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.notes = notes;
    if (currentUser) {
      ui.setSyncState('syncing');
      const { error } = await db.tasks.update(id, { notes });
      ui.setSyncState(error ? 'error' : 'ok');
    }
  },
};

window.addTask = async () => {
  const name = ui.getTaskInputValue();
  if (!name || !currentUser) return;
  ui.clearTaskInput();
  ui.setSyncState('syncing');
  const { data, error } = await db.tasks.create(currentUser.id, name);
  if (!error && data) {
    tasks.unshift({ id: data.id, name: data.name, done: false, pomodoros: 0, notes: '' });
    renderTasks();
    ui.setSyncState('ok');
  } else {
    ui.setSyncState('error');
  }
};

// ══════════════════════════════════════════════════════════════════════
//  DAILY GOAL
// ══════════════════════════════════════════════════════════════════════
async function _loadTodayCount() {
  if (!currentUser) return;
  const { data } = await db.sessions.loadFocus(currentUser.id);
  if (!data) return;
  const today = new Date(); today.setHours(0,0,0,0);
  todayCount = data.filter(s => new Date(s.completed_at) >= today).length;
}

// ══════════════════════════════════════════════════════════════════════
//  STATS
// ══════════════════════════════════════════════════════════════════════
async function loadStats() {
  if (!currentUser) return;

  const [{ data: focusData }, { data: recent }] = await Promise.all([
    db.sessions.loadFocus(currentUser.id),
    db.sessions.loadRecent(currentUser.id),
  ]);

  const fd = focusData || [];

  const today = new Date(); today.setHours(0,0,0,0);
  todayCount = fd.filter(s => new Date(s.completed_at) >= today).length;
  const totalMins = fd.reduce((a, s) => a + s.duration, 0);

  const daySet = new Set(fd.map(s => new Date(s.completed_at).toDateString()));
  let streak = 0;
  const check = new Date();
  while (daySet.has(check.toDateString())) { streak++; check.setDate(check.getDate() - 1); }

  const weekCounts = [];
  for (let i = 6; i >= 0; i--) {
    const d  = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const nx = new Date(d); nx.setDate(nx.getDate() + 1);
    weekCounts.push(fd.filter(s => { const sd = new Date(s.completed_at); return sd >= d && sd < nx; }).length);
  }

  const heatmapMap = {};
  fd.forEach(s => {
    const k = new Date(s.completed_at).toDateString();
    heatmapMap[k] = (heatmapMap[k] || 0) + 1;
  });

  ui.renderStats({
    total:        fd.length,
    today:        todayCount,
    streak,
    hours:        (totalMins / 60).toFixed(1) + 'h',
    weekData:     weekCounts,
    heatmapData:  heatmapMap,
    historyItems: recent || [],
    dailyGoal:    cfg.dailyGoal,
    onDeleteHistory: async (id) => {
      ui.setSyncState('syncing');
      const { error } = await db.sessions.remove(id);
      ui.setSyncState(error ? 'error' : 'ok');
      if (!error) loadStats();
    },
  });

  ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
}

// ══════════════════════════════════════════════════════════════════════
//  THEMES
// ══════════════════════════════════════════════════════════════════════
function applyTheme(name, persist = true) {
  currentTheme = name;
  ui.applyTheme(name);
  if (currentUser) spawnCreatures(name);
  // Reiniciar música ambiental con el nuevo tema
  if (cfg.ambient && currentUser) {
    stopAmbient();
    setTimeout(() => startAmbient(name), 800);
  }
  if (persist && currentUser) debounceSaveSettings();
}

window.setTheme = applyTheme;

// ══════════════════════════════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════════════════════════════
window.switchTab = (name, event) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (event?.currentTarget) event.currentTarget.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'stats') loadStats();
};

// ══════════════════════════════════════════════════════════════════════
//  TIMER CONTROLS
// ══════════════════════════════════════════════════════════════════════
window.toggleTimer = () => {
  const running = toggleTimer();
  ui.setStartButtonText(running ? 'Pausar' : 'Reanudar');
  if (running && cfg.deepFocus) _enterDeepFocus();
  if (!running && cfg.deepFocus) _exitDeepFocus();
};

window.resetTimer = () => {
  resetTimer();
  _exitDeepFocus();
  ui.setStartButtonText('Iniciar');
  ui.renderTimer(getState());
};

window.skipSession = () => {
  skipSession();
};

// ══════════════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════════════
(async () => {
  drawStars();
  window.addEventListener('resize', drawStars);

  ui.applyTheme('ocean');
  ui.renderTimer(getState());
  ui.renderDailyGoalRing(0, cfg.dailyGoal);

  db.auth.onStateChange(async (event, session) => {
    if (session?.user) await handleLogin(session.user);
    else handleLogout();
  });

  const { data: { session } } = await db.auth.getSession();
  if (!session) ui.hideLoading();
  else setTimeout(ui.hideLoading, 1200);
})();
