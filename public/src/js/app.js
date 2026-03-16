/**
 * app.js — FocusNature v5
 * Punto de entrada principal. Conecta todos los módulos.
 */

import { cfg }                                         from './config.js';
import * as db                                         from './db.js';
import { initTimer, toggleTimer, resetTimer,
         skipSession, setMode, setTask,
         clearTask, getState }                         from './timer.js';
import * as ui                                         from './ui.js';
import { playSessionEnd, previewSound }                from './sound.js';
import { burstConfetti }                                from './confetti.js';
import { spawnCreatures, drawStars }                   from './creatures.js';
import { initAmbient, startAmbient, stopAmbient,
         switchAmbient, setVolume }                     from './ambient.js';
import { notifySessionEnd,
         requestNotificationPermission,
         getNotificationPermission }                    from './notifications.js';
import { t, setLang, getLang,
         getSupportedLangs, applyToDOM }                from './i18n.js';
import { registerCommand, openPalette,
         closePalette, isPaletteOpen }                  from './commands.js';

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
    playSessionEnd(currentTheme);
    if (finishedMode === 'focus') {
      burstConfetti(_getAccentColor());
      const td = document.getElementById('timer-disp');
      if (td) {
        td.classList.add('timer-bounce');
        setTimeout(() => td.classList.remove('timer-bounce'), 600);
      }
    }
    
    notifySessionEnd(finishedMode, getState().mode, getState().currentTaskName);

    if (currentUser) {
      ui.setSyncState('syncing');
      const { error } = await db.sessions.create(currentUser.id, finishedMode, durationMin, taskId, taskName);
      if (error) {
        _queueFailedSession({ userId: currentUser.id, mode: finishedMode, duration: durationMin, taskId, taskName });
        ui.setSyncState('error');
        _showToast('Sin conexión — sesión guardada localmente', null, null);
      } else {
        ui.setSyncState('ok');
        _flushSessionQueue();
      }
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
          if (t.id === activeTaskId) _updateTaskBadge(t);
          if (currentUser) await db.tasks.update(taskId, { pomodoros: t.pomodoros });
        }
      }
    }
    ui.setStartButtonText('Iniciar');
    if (cfg.autoBreak && finishedMode === 'focus') {
      setTimeout(() => window.toggleTimer(), 1200);
    }
  },
});

// ══════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════
async function handleLogin(user) {
  try {
    currentUser = user;

    // Mostrar app inmediatamente
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('top-bar').style.display     = 'flex';
    document.getElementById('app-main').style.display    = 'block';
    document.getElementById('user-avatar').textContent   = user.email.charAt(0).toUpperCase();
    document.getElementById('user-email-lbl').textContent = user.email;

    // Resetear UI
    ui.resetUI();
    
    // Esperar a que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 50));

    // Cargar datos en paralelo con manejo de errores individual
    const [settingsResult, tasksResult, todayResult] = await Promise.allSettled([
      loadSettings().catch(e => { console.warn('Settings error:', e); return null; }),
      loadTasks().catch(e => { console.warn('Tasks error:', e); return null; }),
      loadTodayCount().catch(e => { console.warn('Today count error:', e); return null; })
    ]);

    // Si settings fallaron, usar defaults
    if (settingsResult.status === 'rejected') {
      applyTheme('ocean', false);
    }

    // Flush sesiones pendientes
    const queued = _getQueuedCount();
    if (queued > 0) {
      setTimeout(() => _flushSessionQueue(), 1500);
    }

    // Cargar notas rápidas
    try {
      const notes = await db.settings.loadQuickNotes(user.id);
      const el = document.getElementById('quick-notes-area');
      if (el && notes) el.value = notes;
    } catch(e) { /* ignore */ }

    // Inicializar todo
    spawnCreatures(currentTheme);
    drawStars();
    ui.renderTimer(getState());
    ui.renderSessionDots(getState().sessionsDone);
    ui.renderDailyGoalRing(todayCount, cfg.dailyGoal);
    ui.setStartButtonText('Iniciar');
    
    // Actualizar UI de idioma y sonido
    _updateSoundBtns(cfg.soundStyle || 'bells');
    applyToDOM();
    _updateNotifToggle(getNotificationPermission());
    
    // Highlight current language
    const curLang = getLang();
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === curLang));
    
    // Highlight custom accent
    if (cfg.customAccent) {
      document.querySelectorAll('.ctheme-swatch').forEach(b => {
        const bg = b.style.backgroundColor || b.style.background;
        b.classList.toggle('active', bg === cfg.customAccent);
      });
      const ci = document.getElementById('custom-color-input');
      if (ci) ci.value = cfg.customAccent;
    }

    // Mostrar mensaje de bienvenida
    _showWelcomeMessage(user.email);

  } catch (err) {
    console.error('Login error:', err);
    ui.showAuthError('Error al cargar la aplicación. Por favor, recarga la página.');
  }
}

function _showWelcomeMessage(email) {
  const hour = new Date().getHours();
  let msg = '';
  if (hour < 12) msg = '¡Buenos días!';
  else if (hour < 18) msg = '¡Buenas tardes!';
  else msg = '¡Buenas noches!';
  
  const banner = document.getElementById('break-banner');
  if (banner) {
    banner.textContent = `${msg} Bienvenido/a de nuevo, ${email.split('@')[0]}`;
    banner.className = 'break-banner visible';
    setTimeout(() => banner.classList.remove('visible'), 4000);
  }
}

function handleLogout() {
  currentUser  = null;
  tasks        = [];
  activeTaskId = null;
  todayCount   = 0;
  stopAmbient();
  _exitDeepFocus();
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('top-bar').style.display     = 'none';
  document.getElementById('app-main').style.display    = 'none';
  ui.clearAuthMessages();
  ui.setCurrentTaskBadge(null);
  ui.renderTasks([], null, taskHandlers);
}

window.doLogout = async () => {
  try {
    stopAmbient();
    if (window.timerInterval) clearInterval(window.timerInterval);
    await db.auth.signOut();
    
    currentUser = null;
    tasks = [];
    activeTaskId = null;
    todayCount = 0;
    
    const guestCfg = localStorage.getItem('fn_guest_cfg');
    localStorage.clear();
    if (guestCfg) localStorage.setItem('fn_guest_cfg', guestCfg);
    
    sessionStorage.clear();
    
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name?.includes('supabase') || db.name?.includes('focusnature')) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    }
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      navigator.serviceWorker.controller.postMessage('CLEAR_CACHE', [channel.port2]);
      await new Promise(resolve => {
        channel.port1.onmessage = resolve;
        setTimeout(resolve, 500);
      });
    }
    
    window.location.replace('/');
    
  } catch (e) {
    console.warn('Logout error:', e);
    window.location.replace('/');
  }
};

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

// ── Tab switcher ─────────────────────────────────────────────────────
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

  if (tabs) tabs.style.display = tab === 'reset' ? 'none' : '';

  if (btnLogin) btnLogin.classList.toggle('active', tab === 'login');
  if (btnReg)   btnReg.classList.toggle('active',   tab === 'register');

  Object.entries(forms).forEach(([key, el]) => {
    if (el) el.style.display = key === tab ? 'block' : 'none';
  });
};

// ── Password strength ─────────────────────────────────────────────────
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
    cfg.autoBreak  = data.auto_break  ?? false;
    cfg.soundStyle = data.sound_style ?? 'bells';
    cfg.autoTheme   = data.auto_theme   ?? false;
    cfg.presetName  = data.preset_name  ?? '';
    cfg.customAccent= data.custom_accent || '';
    if (data.lang) setLang(data.lang);
    if (cfg.customAccent) _applyCustomAccent(cfg.customAccent);
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
    auto_break:  cfg.autoBreak,
    sound_style: cfg.soundStyle,
    auto_theme:   cfg.autoTheme,
    preset_name:  cfg.presetName,
    custom_accent: cfg.customAccent || '',
    lang:          getLang(),
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

window.setSoundStyle = (style) => {
  cfg.soundStyle = style;
  ui.renderSettings();
  _updateSoundBtns(style);
  debounceSave();
  previewSound(style, currentTheme);
};

function _updateSoundBtns(style) {
  document.querySelectorAll('.sound-style-btn').forEach(b => b.classList.remove('active'));
  const active = document.getElementById('ss-' + style);
  if (active) active.classList.add('active');
}

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

window.toggleAutoTheme = () => {
  cfg.autoTheme = !cfg.autoTheme;
  if (cfg.autoTheme) _applyAutoTheme();
  ui.renderSettings();
  debounceSave();
};

window.toggleAutoBreak = () => {
  cfg.autoBreak = !cfg.autoBreak;
  ui.renderSettings();
  debounceSave();
};

window.toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
};

document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('btn-fullscreen');
  if (btn) btn.textContent = document.fullscreenElement ? '⊠' : '⛶';
});

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

window.onTaskDragStart = (e, id) => {
  e.dataTransfer.setData('text/plain', id);
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
};
window.onTaskDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
window.onTaskDragEnter = (e) => { e.currentTarget.closest('.task-item')?.classList.add('drag-over'); };
window.onTaskDragLeave = (e) => { e.currentTarget.closest('.task-item')?.classList.remove('drag-over'); };
window.onTaskDrop = async (e, targetId) => {
  e.preventDefault();
  const srcId = e.dataTransfer.getData('text/plain');
  if (!srcId || srcId === targetId) return;
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over','dragging'));
  const srcIdx = tasks.findIndex(t => t.id === srcId);
  const tgtIdx = tasks.findIndex(t => t.id === targetId);
  if (srcIdx === -1 || tgtIdx === -1) return;
  const [moved] = tasks.splice(srcIdx, 1);
  tasks.splice(tgtIdx, 0, moved);
  renderTasks();
  if (currentUser) {
    ui.setSyncState('syncing');
    const updates = tasks.map((t, i) => db.tasks.update(t.id, { position: i }));
    await Promise.all(updates);
    ui.setSyncState('ok');
  }
};

const taskHandlers = {
  onFocus: (id) => {
    activeTaskId = id;
    const t = tasks.find(t => t.id === id);
    setTask(id, t?.name || null);
    _updateTaskBadge(t);
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
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    tasks = tasks.filter(t => t.id !== id);
    if (activeTaskId === id) { activeTaskId = null; clearTask(); ui.setCurrentTaskBadge(null); }
    renderTasks();
    
    let undone = false;
    _showToast(
      (task.done ? '✓ ' : '') + (task.name.length > 28 ? task.name.slice(0,28)+'…' : task.name) + ' eliminada',
      'Deshacer',
      async () => {
        undone = true;
        tasks.splice(0, 0, task);
        tasks.sort((a, b) => (a.position||0) - (b.position||0));
        renderTasks();
      }
    );
    
    setTimeout(async () => {
      if (undone) return;
      if (currentUser) {
        ui.setSyncState('syncing');
        const { error } = await db.tasks.remove(id);
        ui.setSyncState(error ? 'error' : 'ok');
      }
    }, 4200);
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

const PRESETS = {
  standard:  { name: 'Estándar',     focus: 25, short: 5,  long: 15, sessions: 4 },
  deep:      { name: 'Foco profundo',focus: 50, short: 10, long: 20, sessions: 3 },
  sprint:    { name: 'Sprint',       focus: 15, short: 3,  long: 10, sessions: 6 },
  ultralong: { name: 'Ultra largo',  focus: 90, short: 15, long: 30, sessions: 2 },
};

window.applyPreset = (key) => {
  const p = PRESETS[key]; if (!p) return;
  cfg.focus = p.focus; cfg.short = p.short; cfg.long = p.long; cfg.sessions = p.sessions;
  cfg.presetName = key;
  ui.renderSettings();
  setMode(getState().mode);
  ui.renderSessionDots(getState().sessionsDone);
  debounceSave();
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('preset-' + key);
  if (btn) btn.classList.add('active');
};

window.addTask = async () => {
  const name = ui.getTaskInputValue();
  if (!name || !currentUser) return;
  const est  = parseInt(document.getElementById('task-est-inp')?.value || '0') || 0;
  const label= document.getElementById('task-label-sel')?.value || '';
  ui.clearTaskInput();
  if (document.getElementById('task-est-inp')) document.getElementById('task-est-inp').value = '';
  ui.setSyncState('syncing');
  const { data, error } = await db.tasks.create(currentUser.id, name, est, label);
  if (!error && data) {
    tasks.unshift({ id: data.id, name: data.name, done: false, pomodoros: 0, notes: '', estimate: est, label });
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
  _checkStreakRisk(data);
}

function _checkStreakRisk(focusData) {
  const hour = new Date().getHours();
  if (hour < 17 || todayCount > 0) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const hadYesterday = focusData.some(s => {
    const d = new Date(s.completed_at);
    return d >= yesterday && d < today;
  });
  if (hadYesterday) {
    const banner = document.getElementById('break-banner');
    if (banner) {
      banner.textContent = '🔥 Tu racha está en riesgo — ¡haz al menos 1 pomodoro hoy!';
      banner.className = 'break-banner lbreak visible';
      setTimeout(() => banner.classList.remove('visible'), 10000);
    }
  }
}

window.exportCSV = () => {
  if (!currentUser) return;
  db.sessions.loadRecent(currentUser.id).then(({ data }) => {
    if (!data || !data.length) return alert('Sin datos para exportar.');
    const rows = [['Fecha','Modo','Duracion (min)','Tarea']];
    data.forEach(s => {
      const d = new Date(s.completed_at).toLocaleString('es-ES');
      rows.push([d, s.mode, s.duration, s.task_name || '']);
    });
    const CRLF = String.fromCharCode(13, 10);
    const csv  = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join(CRLF);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'focusnature-sesiones.csv'; a.click();
    URL.revokeObjectURL(url);
  });
};

window.doChangePassword = async () => {
  const newPass  = (document.getElementById('cp-new')?.value  || '').trim();
  const confPass = (document.getElementById('cp-conf')?.value || '').trim();
  if (!newPass || !confPass) return _cpMsg('Rellena los dos campos.', 'err');
  if (newPass.length < 6)    return _cpMsg('Mínimo 6 caracteres.', 'err');
  if (newPass !== confPass)  return _cpMsg('Las contraseñas no coinciden.', 'err');
  const btn = document.getElementById('cp-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
  const { error } = await sb.auth.updateUser({ password: newPass });
  if (btn) { btn.disabled = false; btn.textContent = 'Cambiar contraseña'; }
  if (error) _cpMsg(error.message, 'err');
  else {
    _cpMsg('¡Contraseña actualizada!', 'ok');
    if (document.getElementById('cp-new'))  document.getElementById('cp-new').value  = '';
    if (document.getElementById('cp-conf')) document.getElementById('cp-conf').value = '';
  }
};
function _cpMsg(msg, type) {
  const el = document.getElementById('cp-msg');
  if (!el) return;
  el.textContent  = msg;
  el.className    = 'cp-msg ' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

let _allHistoryItems = [];
let _filteredTaskName = '';

window.filterHistory = (val) => {
  _filteredTaskName = val.toLowerCase().trim();
  const filtered = _filteredTaskName
    ? _allHistoryItems.filter(s => (s.task_name || '').toLowerCase().includes(_filteredTaskName))
    : _allHistoryItems;
  ui.updateHistoryList(filtered, async (id) => {
    ui.setSyncState('syncing');
    const { error } = await db.sessions.remove(id);
    ui.setSyncState(error ? 'error' : 'ok');
    if (!error) loadStats();
  });
};

function _resetHistoryFilter() {
  _filteredTaskName = '';
  const el = document.getElementById('history-filter');
  if (el) el.value = '';
}

let _notesTimer = null;
window.onQuickNotesChange = (val) => {
  clearTimeout(_notesTimer);
  _notesTimer = setTimeout(() => {
    if (currentUser) db.settings.save(currentUser.id, { quick_notes: val });
  }, 1000);
};

async function loadStats() {
  if (!currentUser) return;

  ui.setSyncState('syncing');
  _setStatsLoading(true);

  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado')), 12000)
    );
    const [{ data: fd }, { data: recent }] = await Promise.race([
      Promise.all([
        db.sessions.loadFocus(currentUser.id),
        db.sessions.loadRecent(currentUser.id),
      ]),
      timeout,
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

  _allHistoryItems = recent || [];
  _filteredTaskName = '';
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

    _renderWeeklyChallenge(focusData);
    ui.setSyncState('ok');
  } catch (err) {
    console.error('loadStats error:', err);
    ui.setSyncState('error');
    _showStatsError(err.message);
  } finally {
    _setStatsLoading(false);
  }
}

function _setStatsLoading(loading) {
  const statIds = ['stat-total','stat-today','stat-streak','stat-hours'];
  statIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (loading) {
      el.dataset.orig = el.textContent;
      el.style.opacity = '0.4';
      el.style.animation = 'statPulse 1s ease-in-out infinite';
    } else {
      el.style.opacity = '';
      el.style.animation = '';
    }
  });
  const hist = document.getElementById('history-list');
  if (loading && hist && hist.children.length <= 1) {
    hist.innerHTML = '<div class="empty-msg" style="opacity:.5">Cargando historial…</div>';
  }
}

function _showStatsError(msg) {
  const hist = document.getElementById('history-list');
  if (hist) {
    hist.innerHTML = '<div class="empty-msg" style="color:var(--muted)">⚠️ Error al cargar: ' + (msg || 'inténtalo de nuevo') + '</div>';
  }
}

function _registerCommands() {
  const T = (tab) => () => window.switchTab(tab, null);
  const themes = [
    ['ocean','🌊'],['meadow','🌿'],['mountain','🏔️'],['forest','🌲'],
    ['desert','🏜️'],['city','🌃'],['arctic','❄️'],['space','🚀'],
    ['deep','🌑'],['volcano','🌋'],['rain','🌧️'],['japan','🏯'],
    ['swamp','🌿'],['cave','🐉'],['underarctic','🐋'],['savanna','🌅'],
    ['alps','🏔'],['festival','🎆'],['jungle','🌺'],['mars','🔭'],
  ];
  const THEME_NAMES = {
    ocean:'Mar',meadow:'Prado',mountain:'Montaña',forest:'Bosque',
    desert:'Desierto',city:'Ciudad',arctic:'Ártico',space:'Espacio',
    deep:'Abisal',volcano:'Volcán',rain:'Lluvia',japan:'Japón',
    swamp:'Ciénaga',cave:'Cueva',underarctic:'Ártico sub.',savanna:'Sabana',
    alps:'Alpes',festival:'Festival',jungle:'Selva',mars:'Marte',
  };
  
  [['timer','⏱'],['tasks','✓'],['stats','📊'],['settings','⚙️'],['notes','📝']].forEach(([tab,icon]) => {
    registerCommand({ id:'tab_'+tab, label:'Ir a '+tab.charAt(0).toUpperCase()+tab.slice(1), icon, section:'Navegación', action: T(tab) });
  });
  
  registerCommand({ id:'start',  label:'Iniciar / Pausar timer', icon:'▶', section:'Timer', action: window.toggleTimer });
  registerCommand({ id:'reset',  label:'Reiniciar timer',        icon:'↺', section:'Timer', action: window.resetTimer });
  registerCommand({ id:'skip',   label:'Saltar sesión',          icon:'⏭', section:'Timer', action: window.skipSession });
  
  themes.forEach(([key, emoji]) => {
    registerCommand({ id:'theme_'+key, label:'Tema: '+THEME_NAMES[key], icon:emoji, section:'Temas', action: () => applyTheme(key) });
  });
  
  [['standard','Estándar 25/5'],['deep','Foco profundo 50/10'],['sprint','Sprint 15/3'],['ultralong','Ultra 90/15']].forEach(([k,l]) => {
    registerCommand({ id:'preset_'+k, label:'Preset: '+l, icon:'⚡', section:'Presets', action: () => window.applyPreset(k) });
  });
  
  registerCommand({ id:'fullscreen', label:'Pantalla completa', icon:'⛶', section:'App', action: window.toggleFullscreen });
  registerCommand({ id:'deepfocus',  label:'Activar foco profundo', icon:'🎯', section:'App', action: window.toggleDeepFocus });
}

function _renderWeeklyChallenge(focusData) {
  const el = document.getElementById('weekly-challenge');
  if (!el) return;
  const now = new Date();
  const startOfLastWeek = new Date(now);
  startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
  const endOfLastWeek = new Date(startOfLastWeek);
  endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
  const lastWeekSessions = focusData.filter(s => {
    const d = new Date(s.completed_at);
    return d >= startOfLastWeek && d < endOfLastWeek;
  });
  const dayCount = {};
  lastWeekSessions.forEach(s => {
    const day = new Date(s.completed_at).toDateString();
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  const bestDay = Math.max(0, ...Object.values(dayCount));
  const weekTotal = lastWeekSessions.length;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const thisWeek = focusData.filter(s => new Date(s.completed_at) >= startOfWeek);
  
  let challenge, progress, target;
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const isMonday = now.getDay() === 1;
  if (weekTotal === 0 || isMonday) {
    target = Math.max(5, Math.round(weekTotal * 1.1) || 10);
    challenge = `Completa ${target} pomodoros esta semana`;
    progress = thisWeek.length;
  } else if (bestDay > 0) {
    target = bestDay + 1;
    challenge = `Supera tu récord de ${bestDay} pomodoros en un día`;
    const todayStr = now.toDateString();
    progress = dayCount[todayStr] || 0;
  } else {
    target = 5;
    challenge = 'Completa 5 pomodoros hoy';
    progress = todayCount;
  }
  const pct = Math.min(100, Math.round(progress / target * 100));
  const done = progress >= target;
  el.innerHTML = '<div class="challenge-header">' +
    '<span class="challenge-title">' + (done ? '🏆 ' : '🎯 ') + 'Reto semanal</span>' +
    (done ? '<span class="challenge-badge">¡Completado!</span>' : '') +
    '</div>' +
    '<div class="challenge-text">' + challenge + '</div>' +
    '<div class="challenge-bar-wrap"><div class="challenge-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="challenge-progress">' + progress + ' / ' + target + (done ? ' ✓' : '') + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
//  THEMES
// ══════════════════════════════════════════════════════════════════════
function applyTheme(name, persist = true) {
  currentTheme = name;
  ui.applyTheme(name);
  _updateThemePill(name);
  if (cfg.customAccent) _applyCustomAccent(cfg.customAccent);
  if (currentUser) spawnCreatures(name);
  if (cfg.ambient && currentUser) { switchAmbient(name); }
  if (persist && currentUser) debounceSave();
}
window.setTheme = applyTheme;

window.toggleThemePicker = () => {
  const grid = document.getElementById('theme-picker-grid');
  if (!grid) return;
  const open = grid.classList.toggle('open');
  if (open) {
    setTimeout(() => {
      document.addEventListener('click', _closePicker, { once: true });
    }, 10);
  }
};
function _closePicker() {
  const grid = document.getElementById('theme-picker-grid');
  if (grid) grid.classList.remove('open');
}
window.pickTheme = (name) => {
  applyTheme(name);
  _closePicker();
};

const THEME_META = {
  ocean:    { emoji: '🌊', name: 'Mar'      },
  meadow:   { emoji: '🌿', name: 'Prado'    },
  mountain: { emoji: '🏔️', name: 'Montaña'  },
  forest:   { emoji: '🌲', name: 'Bosque'   },
  desert:   { emoji: '🏜️', name: 'Desierto' },
  city:     { emoji: '🌃', name: 'Ciudad'   },
  arctic:   { emoji: '❄️', name: 'Ártico'   },
  space:    { emoji: '🚀', name: 'Espacio'  },
  deep:     { emoji: '🌑', name: 'Abisal'   },
  volcano:  { emoji: '🌋', name: 'Volcán'   },
  rain:     { emoji: '🌧️', name: 'Lluvia'   },
  japan:    { emoji: '🏯', name: 'Japón'    },
  swamp:    { emoji: '🌿', name: 'Ciénaga'  },
  cave:     { emoji: '🐉', name: 'Cueva'    },
  underarctic: { emoji: '🐋', name: 'Ártico sub.' },
  savanna:  { emoji: '🌅', name: 'Sabana'   },
  alps:     { emoji: '🏔', name: 'Alpes'    },
  festival: { emoji: '🎆', name: 'Festival' },
  jungle:   { emoji: '🌺', name: 'Selva'    },
  mars:     { emoji: '🔭', name: 'Marte'    },
};
function _updateThemePill(name) {
  const meta = THEME_META[name];
  if (!meta) return;
  const emoji = document.getElementById('theme-pill-emoji');
  const label = document.getElementById('theme-pill-name');
  if (emoji) emoji.textContent = meta.emoji;
  if (label) label.textContent = meta.name;
  document.querySelectorAll('.tpick').forEach(b => b.classList.remove('active'));
  const active = document.getElementById('tbtn-' + name);
  if (active) active.classList.add('active');
}

// ══════════════════════════════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════════════════════════════
window.switchTab = (name, event) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (event?.currentTarget) event.currentTarget.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'stats') {
    _resetHistoryFilter();
    loadStats().catch(err => {
      console.error('Stats load error:', err);
      ui.setSyncState('error');
    });
  }
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
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (isPaletteOpen()) closePalette();
    else openPalette();
    return;
  }
  if (['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!currentUser) return;
  if (e.key === ' ')               { e.preventDefault(); window.toggleTimer(); }
  if (e.key.toLowerCase() === 'r') { e.preventDefault(); window.resetTimer(); }
  if (e.key.toLowerCase() === 's') { e.preventDefault(); window.skipSession(); }
  if (e.key === 'Escape')          { closePalette(); }
});

// ── Helpers ──────────────────────────────────────────────────────────
const SESSION_QUEUE_KEY = 'fn_session_queue';

function _queueFailedSession(session) {
  try {
    const q = JSON.parse(localStorage.getItem(SESSION_QUEUE_KEY) || '[]');
    q.push({ ...session, queuedAt: Date.now() });
    localStorage.setItem(SESSION_QUEUE_KEY, JSON.stringify(q));
  } catch(e) { console.warn('Queue error:', e); }
}

async function _flushSessionQueue() {
  if (!currentUser) return;
  try {
    const q = JSON.parse(localStorage.getItem(SESSION_QUEUE_KEY) || '[]');
    if (!q.length) return;
    let saved = 0;
    const remaining = [];
    for (const s of q) {
      const { error } = await db.sessions.create(s.userId || currentUser.id, s.mode, s.duration, s.taskId, s.taskName);
      if (error) remaining.push(s);
      else saved++;
    }
    localStorage.setItem(SESSION_QUEUE_KEY, JSON.stringify(remaining));
    if (saved > 0) {
      _showToast(saved + ' sesión' + (saved > 1 ? 'es' : '') + ' sincronizada' + (saved > 1 ? 's' : '') + ' ✓', null, null);
      ui.setSyncState('ok');
    }
    if (remaining.length > 0) ui.setSyncState('error');
  } catch(e) { console.warn('Flush error:', e); }
}

function _getQueuedCount() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_QUEUE_KEY) || '[]').length;
  } catch { return 0; }
}

window.manualSync = async () => {
  if (!currentUser) return;
  const btn = document.getElementById('btn-sync');
  if (btn) { btn.style.animation = 'spin 1s linear infinite'; }
  ui.setSyncState('syncing');
  try {
    await _flushSessionQueue();
    await loadTodayCount();
    ui.setSyncState('ok');
    _showToast('Sincronizado ✓', null, null);
  } catch(e) {
    ui.setSyncState('error');
    _showToast('Error de sincronización', null, null);
  } finally {
    if (btn) { btn.style.animation = ''; }
  }
};

function _clearSWCache() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  const ch = new MessageChannel();
  ch.port1.onmessage = () => { console.log('SW cache cleared'); };
  navigator.serviceWorker.controller.postMessage('CLEAR_CACHE', [ch.port2]);
}

function _updateSyncBadge() {
  const badge = document.getElementById('sync-badge');
  const count = _getQueuedCount();
  if (badge) {
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  const btn = document.getElementById('btn-sync');
  if (btn) btn.title = count > 0 ? count + ' sesiones pendientes de sincronizar' : 'Sincronizar ahora';
}

let _toastTimer = null;
function _showToast(msg, actionLabel, actionFn) {
  let toast = document.getElementById('fn-toast');
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

function _getAccentColor() {
  return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#4ecdc4';
}

function _updateTaskBadge(task) {
  if (!task) { ui.setCurrentTaskBadge(null); return; }
  const remaining = Math.max(0, (task.estimate || 0) - (task.pomodoros || 0));
  const mins      = remaining * cfg.focus;
  const suffix    = remaining > 0
    ? ` · ~${remaining} 🍅 restantes (${mins} min)`
    : '';
  ui.setCurrentTaskBadge(task.name + suffix);
}

function _applyAutoTheme() {
  const h = new Date().getHours();
  let theme;
  if      (h >= 6  && h < 9)  theme = 'meadow';
  else if (h >= 9  && h < 14) theme = 'mountain';
  else if (h >= 14 && h < 17) theme = 'ocean';
  else if (h >= 17 && h < 20) theme = 'savanna';
  else if (h >= 20 && h < 23) theme = 'forest';
  else                         theme = 'space';
  applyTheme(theme, false);
}

function _applyCustomAccent(hex) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return;
  cfg.customAccent = hex;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const lighten = v => Math.min(255, v + 40);
  const accent2 = '#' + [lighten(r),lighten(g),lighten(b)].map(v => v.toString(16).padStart(2,'0')).join('');
  
  let tag = document.getElementById('_custom-accent-style');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = '_custom-accent-style';
    document.head.appendChild(tag);
  }
  tag.textContent = `:root{--accent:${hex}!important;--accent2:${accent2}!important;}`;
  
  document.querySelectorAll('.ctheme-swatch').forEach(b => {
    b.classList.toggle('active', b.style.background === hex || b.style.backgroundColor === hex);
  });
  const colorInput = document.getElementById('custom-color-input');
  if (colorInput) colorInput.value = hex;
}
window.applyCustomAccent = (hex) => {
  _applyCustomAccent(hex);
  debounceSave();
};
window.clearCustomAccent = () => {
  cfg.customAccent = '';
  const tag = document.getElementById('_custom-accent-style');
  if (tag) tag.remove();
  document.querySelectorAll('.ctheme-swatch').forEach(b => b.classList.remove('active'));
  debounceSave();
  applyTheme(currentTheme, false);
};

window.switchLang = (code) => {
  setLang(code);
  applyToDOM();
  debounceSave();
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === code));
};

window.toggleNotifications = async () => {
  const perm = getNotificationPermission();
  if (perm === 'granted') {
    alert('Para desactivar las notificaciones, usa la configuración de tu navegador.');
    return;
  }
  const result = await requestNotificationPermission();
  _updateNotifToggle(result);
};
function _updateNotifToggle(perm) {
  const sw = document.getElementById('sw-notifications');
  if (sw) sw.className = 'sw' + (perm === 'granted' ? ' on' : '');
}

// ══════════════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════════════
(async () => {
  try {
    if (!window.supabase) {
      throw new Error('Supabase no cargó. Comprueba tu conexión a internet.');
    }
    if (!window.__SUPABASE_URL__ || window.__SUPABASE_URL__.includes('TU-PROYECTO')) {
      throw new Error('Faltan las credenciales de Supabase. Configura el archivo .env del servidor.');
    }

    const { createClient } = window.supabase;
    sb = createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON__);
    db.initDb(sb);
    initAmbient();

    drawStars();
    window.addEventListener('resize', drawStars);

    if (cfg.autoTheme) _applyAutoTheme();
    ui.applyTheme('ocean');
    spawnCreatures('ocean');

    applyToDOM();

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (confirm('Nueva versión disponible. ¿Recargar para actualizar?')) {
              window.location.reload();
            }
          }
        });
      });
    }

    _updateNotifToggle(getNotificationPermission());

    _registerCommands();
    ui.renderTimer(getState());
    ui.renderDailyGoalRing(0, cfg.dailyGoal);

    if (window.location.hash === '#register') {
      window.showAuthTab('register');
    }

    db.auth.onStateChange(async (event, session) => {
      if (event === 'SIGNED_IN'  && session?.user) await handleLogin(session.user);
      if (event === 'SIGNED_OUT')                  handleLogout();
    });

    await db.auth.getSession();

  } catch (err) {
    console.error('FocusNature boot error:', err);
    ui.showAuthError('⚠️ ' + err.message);
  }
})();