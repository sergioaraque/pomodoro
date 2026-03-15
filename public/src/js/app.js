/**
 * app.js — FocusNature v2
 * Punto de entrada principal. Conecta todos los módulos.
 */

import { cfg }                                         from './config.js';
import * as db                                         from './db.js';
import { initTimer, toggleTimer, resetTimer,
         skipSession, setMode, setTask,
         clearTask, getState }                         from './timer.js';
import * as ui                                         from './ui.js';
import { playSessionEnd }                              from './sound.js';
import { spawnCreatures, drawStars }                   from './creatures.js';
import { initAmbient, startAmbient, stopAmbient,
         setVolume }                                   from './ambient.js';

// ─── Supabase client — initialized inside boot ────────────────────────
let sb = null;

// ─── App state ────────────────────────────────────────────────────────
let currentUser  = null;
let tasks        = [];
let activeTaskId = null;
let currentTheme = 'ocean';
let saveTimer    = null;
let todayCount   = 0;

// ══════════════════════════════════════════════════════════════════════
//  TIMER
// ══════════════════════════════════════════════════════════════════════
initTimer({
  onTick: (state) => {
    ui.renderTimer(state);
    const running = state.running;
    const sLeft   = state.secondsLeft;
    const sTotal  = state.totalSeconds;
    ui.setStartButtonText(running ? 'Pausar' : (sLeft < sTotal ? 'Reanudar' : 'Iniciar'));
    // Live tab title
    const mm = String(Math.floor(sLeft / 60)).padStart(2, '0');
    const ss = String(sLeft % 60).padStart(2, '0');
    const emoji = state.mode === 'focus' ? '🍅' : state.mode === 'short' ? '🌿' : '🌊';
    document.title = running ? `${emoji} ${mm}:${ss} — FocusNature` : 'FocusNature — Pomodoro';
  },

  onEnd: async (finishedMode, durationMin, taskId, taskName) => {
    playSessionEnd();

    if (currentUser) {
      ui.setSyncState('syncing');
      const { error } = await db.sessions.create(currentUser.id, finishedMode, durationMin, taskId, taskName);
      ui.setSyncState(error ? 'error' : 'ok');
    }

    if (finishedMode === 'focus') {
      todayCount++;
      ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
      if (todayCount === cfg.dailyGoal) ui.showGoalAchieved();

      if (taskId) {
        const t = tasks.find(t => t.id === taskId);
        if (t) {
          t.pomodoros++;
          renderTasks();
          if (currentUser) await db.tasks.update(taskId, { pomodoros: t.pomodoros });
        }
      }
    }
    ui.setStartButtonText('Iniciar');
  },
});

// ══════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════
async function handleLogin(user) {
  currentUser = user;
  // Show app, hide auth
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('top-bar').style.display     = 'flex';
  document.getElementById('app-main').style.display    = 'block';
  document.getElementById('user-avatar').textContent   = user.email.charAt(0).toUpperCase();
  document.getElementById('user-email-lbl').textContent = user.email;

  await loadSettings();
  await loadTasks();
  await loadTodayCount();
  spawnCreatures(currentTheme);
  drawStars();
  ui.renderTimer(getState());
  ui.renderSessionDots(getState().sessionsDone);
  ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
  ui.setStartButtonText('Iniciar');
}

function handleLogout() {
  currentUser  = null;
  tasks        = [];
  activeTaskId = null;
  todayCount   = 0;
  stopAmbient();
  _exitDeepFocus();
  // Show auth, hide app
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('top-bar').style.display     = 'none';
  document.getElementById('app-main').style.display    = 'none';
  ui.clearAuthMessages();
  ui.setCurrentTaskBadge(null);
  ui.renderTasks([], null, taskHandlers);
}

// ── Auth form handlers ────────────────────────────────────────────────
window.doLogin = async () => {
  const email = document.getElementById('li-email').value.trim();
  const pass  = document.getElementById('li-pass').value;
  if (!email || !pass) return ui.showAuthError('Rellena todos los campos.');

  const btn = document.getElementById('li-btn');
  btn.disabled    = true;
  btn.textContent = 'Entrando…';

  const { error } = await db.auth.signIn(email, pass);

  btn.disabled    = false;
  btn.textContent = 'Entrar';

  if (error) {
    ui.showAuthError(error.message.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message);
  }
};

window.doRegister = async () => {
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if (!email || !pass) return ui.showAuthError('Rellena todos los campos.');
  if (pass.length < 6) return ui.showAuthError('La contraseña debe tener al menos 6 caracteres.');

  const btn = document.getElementById('reg-btn');
  btn.disabled    = true;
  btn.textContent = 'Creando cuenta…';

  const { error } = await db.auth.signUp(email, pass);

  btn.disabled    = false;
  btn.textContent = 'Crear cuenta';

  if (error) ui.showAuthError(error.message);
  else       ui.showAuthSuccess('¡Cuenta creada! Revisa tu correo y luego inicia sesión.');
};

window.doLogout = async () => {
  await db.auth.signOut();
};

window.doResetPassword = async () => {
  const email = (document.getElementById('reset-email')?.value || '').trim();
  if (!email) return ui.showAuthError('Introduce tu correo electrónico.');

  const btn = document.getElementById('reset-btn');
  btn.disabled    = true;
  btn.textContent = 'Enviando…';

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/app',
  });

  btn.disabled    = false;
  btn.textContent = 'Enviar enlace';

  if (error) ui.showAuthError(error.message);
  else       ui.showAuthSuccess('¡Listo! Revisa tu correo para restablecer tu contraseña.');
};

// ── Tab switcher (login / register / reset) ───────────────────────────
window.showAuthTab = (tab) => {
  ui.clearAuthMessages();
  const tabs  = document.getElementById('auth-tabs');
  const forms = {
    login:    document.getElementById('auth-login-form'),
    register: document.getElementById('auth-register-form'),
    reset:    document.getElementById('auth-reset-form'),
  };
  const btnLogin = document.getElementById('at-login');
  const btnReg   = document.getElementById('at-register');

  // Hide/show tabs bar
  if (tabs) tabs.style.display = tab === 'reset' ? 'none' : '';

  // Activate button
  if (btnLogin) btnLogin.classList.toggle('active', tab === 'login');
  if (btnReg)   btnReg.classList.toggle('active',   tab === 'register');

  // Show correct form
  Object.entries(forms).forEach(([key, el]) => {
    if (el) el.style.display = key === tab ? 'block' : 'none';
  });
};

// ── Password strength indicator ───────────────────────────────────────
window.checkPasswordStrength = (val) => {
  const bar  = document.getElementById('pw-bar');
  const hint = document.getElementById('pw-hint');
  if (!bar) return;

  let score = 0;
  if (val.length >= 6)           score++;
  if (val.length >= 10)          score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { w: '0%',   c: 'transparent', t: '' },
    { w: '20%',  c: '#ff6b6b',     t: 'Muy débil' },
    { w: '40%',  c: '#ffa552',     t: 'Débil' },
    { w: '60%',  c: '#ffd54f',     t: 'Aceptable' },
    { w: '80%',  c: '#7ecf3e',     t: 'Fuerte' },
    { w: '100%', c: '#4ecdc4',     t: 'Muy fuerte' },
  ];
  const lvl = levels[Math.min(score, 5)];
  bar.style.width      = lvl.w;
  bar.style.background = lvl.c;
  if (hint) { hint.textContent = lvl.t; hint.style.color = lvl.c; }
};

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

function debounceSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 700);
}

const LIMITS = { focus:[5,90], short:[1,30], long:[5,60], sessions:[2,8], dailyGoal:[1,20] };

window.adjSetting = (key, delta) => {
  const [min, max] = LIMITS[key];
  cfg[key] = Math.max(min, Math.min(max, cfg[key] + delta));
  ui.renderSettings();
  if (key !== 'dailyGoal') setMode(getState().mode);
  ui.renderSessionDots(getState().sessionsDone);
  ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
  debounceSave();
};

window.toggleSound = () => {
  cfg.sound = !cfg.sound;
  ui.renderSettings();
  debounceSave();
};

window.toggleAmbient = () => {
  cfg.ambient = !cfg.ambient;
  if (cfg.ambient) startAmbient(currentTheme);
  else             stopAmbient();
  ui.renderSettings();
  debounceSave();
};

window.setAmbientVolume = (v) => {
  cfg.ambientVol = parseFloat(v);
  setVolume(cfg.ambientVol);
  debounceSave();
};

window.toggleDeepFocus = () => {
  cfg.deepFocus = !cfg.deepFocus;
  if (cfg.deepFocus) _enterDeepFocus();
  else               _exitDeepFocus();
  ui.renderSettings();
  debounceSave();
};

function _enterDeepFocus() {
  document.body.classList.add('deep-focus');
  ui.showDeepFocusOverlay(() => {
    cfg.deepFocus = false;
    _exitDeepFocus();
    ui.renderSettings();
    debounceSave();
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
    if (activeTaskId === id) { activeTaskId = null; clearTask(); ui.setCurrentTaskBadge(null); }
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
//  STATS
// ══════════════════════════════════════════════════════════════════════
async function loadTodayCount() {
  if (!currentUser) return;
  const { data } = await db.sessions.loadFocus(currentUser.id);
  if (!data) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  todayCount = data.filter(s => new Date(s.completed_at) >= today).length;
}

async function loadStats() {
  if (!currentUser) return;
  const [{ data: fd }, { data: recent }] = await Promise.all([
    db.sessions.loadFocus(currentUser.id),
    db.sessions.loadRecent(currentUser.id),
  ]);
  const focusData = fd || [];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  todayCount = focusData.filter(s => new Date(s.completed_at) >= today).length;
  const totalMins = focusData.reduce((a, s) => a + s.duration, 0);

  const daySet = new Set(focusData.map(s => new Date(s.completed_at).toDateString()));
  let streak = 0;
  const chk = new Date();
  while (daySet.has(chk.toDateString())) { streak++; chk.setDate(chk.getDate() - 1); }

  const weekCounts = [];
  for (let i = 6; i >= 0; i--) {
    const d  = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const nx = new Date(d); nx.setDate(nx.getDate() + 1);
    weekCounts.push(focusData.filter(s => { const sd = new Date(s.completed_at); return sd >= d && sd < nx; }).length);
  }

  const heatmap = {};
  focusData.forEach(s => {
    const k = new Date(s.completed_at).toDateString();
    heatmap[k] = (heatmap[k] || 0) + 1;
  });

  ui.renderStats({
    total:        focusData.length,
    today:        todayCount,
    streak,
    hours:        (totalMins / 60).toFixed(1) + 'h',
    weekData:     weekCounts,
    heatmapData:  heatmap,
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
  if (cfg.ambient && currentUser) { stopAmbient(); setTimeout(() => startAmbient(name), 800); }
  if (persist && currentUser) debounceSave();
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
window.skipSession = () => skipSession();

// ══════════════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!currentUser) return;
  if (e.key === ' ')              { e.preventDefault(); window.toggleTimer(); }
  if (e.key.toLowerCase() === 'r') { e.preventDefault(); window.resetTimer(); }
  if (e.key.toLowerCase() === 's') { e.preventDefault(); window.skipSession(); }
});

// ══════════════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════════════
(async () => {
  try {
    // Validate Supabase config
    if (!window.supabase) {
      throw new Error('Supabase no cargó. Comprueba tu conexión a internet.');
    }
    if (!window.__SUPABASE_URL__ || window.__SUPABASE_URL__.includes('TU-PROYECTO')) {
      throw new Error('Faltan las credenciales de Supabase. Configura el archivo .env del servidor.');
    }

    // Initialize Supabase
    const { createClient } = window.supabase;
    sb = createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON__);
    db.initDb(sb);
    initAmbient();

    // Background visuals
    drawStars();
    window.addEventListener('resize', drawStars);
    ui.applyTheme('ocean');
    spawnCreatures('ocean');
    ui.renderTimer(getState());
    ui.renderDailyGoalRing(0, cfg.dailyGoal);

    // Open register tab if linked from guest page
    if (window.location.hash === '#register') {
      window.showAuthTab('register');
    }

    // Auth state — this is the single source of truth
    // SIGNED_IN fires when a user logs in (or already has a session on load)
    // SIGNED_OUT fires on logout
    db.auth.onStateChange(async (event, session) => {
      if (event === 'SIGNED_IN'  && session?.user) await handleLogin(session.user);
      if (event === 'SIGNED_OUT')                  handleLogout();
    });

    // Check for existing session — triggers onStateChange above if present
    await db.auth.getSession();

  } catch (err) {
    // Show the error in the auth card (which is already visible)
    console.error('FocusNature boot error:', err);
    ui.showAuthError('⚠️ ' + err.message);
  }
})();
