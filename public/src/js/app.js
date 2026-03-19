/**
 * app.js — Punto de entrada principal de FocusNature.
 *
 * Responsabilidades: boot, initTimer callbacks, teclas, tab switcher,
 * sincronización manual y registro de comandos de paleta.
 * La lógica de negocio vive en los módulos especializados.
 */

import { cfg }                            from './config.js';
import { state }                          from './state.js';
import * as db                            from './db.js';
import * as ui                            from './ui.js';
import { initTimer, toggleTimer,
         resetTimer, skipSession,
         getState }                       from './timer.js';
import { playSessionEnd }                 from './sound.js';
import { burstConfetti }                  from './confetti.js';
import { spawnCreatures, drawStars }      from './creatures.js';
import { initAmbient }                    from './ambient.js';
import { notifySessionEnd }               from './notifications.js';
import { applyToDOM }                     from './i18n.js';
import { registerCommand, openPalette,
         closePalette, isPaletteOpen }    from './commands.js';
import { handleLogin, handleLogout }      from './auth.js';
import { applyTheme, THEME_META,
         saveSettingsNow }               from './settings-handler.js';
import { renderTasks, updateTaskBadge, createTask } from './tasks-handler.js';
import { loadTodayCount, loadStats,
         invalidateStatsCache }            from './stats-handler.js';
import { ACHIEVEMENTS, loadAchievements,
         checkNewAchievements }            from './achievements.js';
import { updateFavicon, resetFavicon }  from './favicon.js';

// ── Stuck-task tracking ────────────────────────────────────────────────
let _stuckTaskId = null;
let _stuckCount  = 0;
const _STUCK_THRESHOLD = 3;

// ── Keybindings ────────────────────────────────────────────────────────
function _loadKeybindings() {
  try {
    const s = JSON.parse(localStorage.getItem('fn_keybindings') || '{}');
    return { timer: s.timer ?? ' ', reset: s.reset ?? 'r', skip: s.skip ?? 's' };
  } catch { return { timer: ' ', reset: 'r', skip: 's' }; }
}
let _keys = _loadKeybindings();

function _keyLabel(k) { return k === ' ' ? 'Espacio' : k.toUpperCase(); }

function _renderShortcutKeys() {
  ['timer','reset','skip'].forEach(a => {
    const el = document.getElementById('key-' + a);
    if (el) el.textContent = _keyLabel(_keys[a]);
  });
}

window.startKeyCapture = (action) => {
  const kbd = document.getElementById('key-' + action);
  if (!kbd) return;
  kbd.textContent = '…';
  kbd.classList.add('capturing');
  const handler = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.key !== 'Escape' && e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Shift') {
      _keys[action] = e.key === ' ' ? ' ' : e.key.toLowerCase();
      try { localStorage.setItem('fn_keybindings', JSON.stringify(_keys)); } catch (_) {}
    }
    kbd.textContent = _keyLabel(_keys[action]);
    kbd.classList.remove('capturing');
    document.removeEventListener('keydown', handler, true);
  };
  document.addEventListener('keydown', handler, true);
};

// ── Globals para onclick inline ────────────────────────────────────────
window.spawnCreatures = spawnCreatures;
window.drawStars      = drawStars;
// Wrapper que actualiza el favicon al pausar (onTick no se llama cuando está parado)
window.toggleTimer = () => {
  toggleTimer();
  const s = getState();
  if (!s.running) updateFavicon(s.secondsLeft, s.totalSeconds, s.mode, false);
};

window.logDistraction = () => {
  state.distractionCount++;
  const el = document.getElementById('distract-count');
  if (el) el.textContent = `(${state.distractionCount})`;
};
window.resetTimer       = resetTimer;
window.skipSession      = skipSession;
window.saveSettingsNow  = saveSettingsNow;

// ── Timer ─────────────────────────────────────────────────────────────
initTimer({
  onTick: (s) => {
    ui.renderTimer(s);
    ui.setStartButtonText(s.running ? 'Pausar' : (s.secondsLeft < s.totalSeconds ? 'Reanudar' : 'Iniciar'));
    const mm    = String(Math.floor(s.secondsLeft / 60)).padStart(2, '0');
    const ss    = String(s.secondsLeft % 60).padStart(2, '0');
    const emoji = s.mode === 'focus' ? '🍅' : s.mode === 'short' ? '🌿' : '🌊';
    document.title = s.running ? `${emoji} ${mm}:${ss} — FocusNature` : 'FocusNature — Pomodoro';
    if (s.running) {
      updateFavicon(s.secondsLeft, s.totalSeconds, s.mode, true);
    } else if (s.secondsLeft === s.totalSeconds) {
      resetFavicon();
    } else {
      updateFavicon(s.secondsLeft, s.totalSeconds, s.mode, false);
    }
    const dr = document.getElementById('distract-row');
    if (dr) dr.style.display = s.mode === 'focus' ? 'block' : 'none';
    // Subtítulo de modo (sesión X de Y · Z🍅 hoy / próxima tarea durante pausa)
    const subEl = document.getElementById('mode-subtitle');
    if (subEl) {
      if (s.mode === 'focus') {
        const sessNum = (s.sessionsDone % cfg.sessions) + 1;
        subEl.textContent = `Sesión ${sessNum} de ${cfg.sessions} · ${state.todayCount} 🍅 hoy`;
      } else {
        const activeTask = state.tasks.find(t => t.id === state.activeTaskId);
        subEl.textContent = activeTask ? `↩ Retomar: ${activeTask.name}` : '';
      }
    }
  },

  onEnd: async (finishedMode, durationMin, taskId, taskName) => {
    playSessionEnd(state.theme);

    if (finishedMode === 'focus') {
      const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#4ecdc4';
      burstConfetti(accent);
      const td = document.getElementById('timer-disp');
      if (td) { td.classList.add('timer-bounce'); setTimeout(() => td.classList.remove('timer-bounce'), 600); }
    }

    notifySessionEnd(finishedMode, getState().mode, getState().currentTaskName);

    if (state.user) {
      ui.setSyncState('syncing');
      const { error } = await db.sessions.create(state.user.id, finishedMode, durationMin, taskId, taskName);
      if (error) {
        ui.setSyncState('error');
        ui.showToast('⚠ Sesión no guardada — sin conexión');
      } else {
        ui.setSyncState('ok');
        invalidateStatsCache();
        // Los logros se chequean completos al abrir la pestaña Stats (con datos reales)
        // Aquí solo chequeamos los de hora del día que no requieren datos históricos
        if (finishedMode === 'focus') {
          try {
            const h        = new Date().getHours();
            const unlocked = loadAchievements(state.user.id);
            const stats    = { total: 0, today: 0, bestStreak: 0, bestDay: 0, dailyGoal: 0, hasEarlySession: h < 8, hasLateSession: h >= 22 };
            const newly    = checkNewAchievements(stats, state.user.id, unlocked);
            newly.forEach(a => ui.showToast(`${a.icon} Logro desbloqueado: ${a.name}`));
          } catch (_) {}
        }
      }
    }

    if (finishedMode === 'focus') {
      state.distractionCount = 0;
      const dc = document.getElementById('distract-count');
      if (dc) dc.textContent = '';
      state.todayCount++;
      ui.renderDailyGoalRing(state.todayCount, cfg.dailyGoal);
      const el = document.getElementById('stat-today');
      if (el) el.textContent = state.todayCount;
      if (state.todayCount === cfg.dailyGoal) ui.showGoalAchieved();

      if (taskId) {
        const t = state.tasks.find(t => t.id === taskId);
        if (t) {
          t.pomodoros++;
          renderTasks();
          if (t.id === state.activeTaskId) updateTaskBadge(t);
          if (state.user) await db.tasks.update(taskId, { pomodoros: t.pomodoros });
        }

        // Stuck-task detection
        if (taskId === _stuckTaskId) {
          _stuckCount++;
          if (_stuckCount >= _STUCK_THRESHOLD) {
            _stuckCount = 0;
            const stuckName = taskName || state.tasks.find(t => t.id === taskId)?.name || '';
            ui.showStuckPrompt(stuckName, _STUCK_THRESHOLD, async (stepName) => {
              await createTask(stepName);
            });
          }
        } else {
          _stuckTaskId = taskId;
          _stuckCount  = 1;
        }
      } else {
        _stuckTaskId = null;
        _stuckCount  = 0;
      }
    }

    ui.setStartButtonText('Iniciar');
    if (cfg.autoBreak && finishedMode === 'focus') setTimeout(() => toggleTimer(), 1200);
  },
});

// ── Tab switcher ──────────────────────────────────────────────────────
window.switchTab = (name, event) => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (event?.currentTarget) event.currentTarget.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'stats') {
    const el = document.getElementById('history-filter');
    if (el) el.value = '';
    loadStats().catch(err => { console.error('[app] Stats load error:', err); ui.setSyncState('error'); });
  }
};

// ── Manual sync ────────────────────────────────────────────────────────
window.manualSync = async () => {
  if (!state.user) return;
  const btn = document.getElementById('btn-sync');
  if (btn) btn.style.animation = 'spin 1s linear infinite';
  ui.setSyncState('syncing');
  try {
    await loadTodayCount();
    await loadStats();
    ui.setSyncState('ok');
    ui.showToast('Actualizado ✓');
  } catch {
    ui.setSyncState('error');
    ui.showToast('Error al cargar datos');
  } finally {
    if (btn) btn.style.animation = '';
  }
};

// ── Keyboard shortcuts ─────────────────────────────────────────────────
const _TABS = ['timer', 'tasks', 'stats', 'settings', 'notes'];

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isPaletteOpen() ? closePalette() : openPalette();
    return;
  }
  // Ctrl/Cmd + 1-5 → cambiar pestaña
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '5') {
    const tab = _TABS[parseInt(e.key) - 1];
    if (tab) { e.preventDefault(); window.switchTab(tab, null); }
    return;
  }
  if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!state.user) return;
  const k = e.key === ' ' ? ' ' : e.key.toLowerCase();
  if (k === _keys.timer) { e.preventDefault(); window.toggleTimer(); }
  if (k === _keys.reset) { e.preventDefault(); resetTimer(); }
  if (k === _keys.skip)  { e.preventDefault(); skipSession(); }
  if (e.key === 'Escape') { closePalette(); }
});

// ── Command palette ────────────────────────────────────────────────────
function _registerCommands() {
  const T = (tab) => () => window.switchTab(tab, null);
  [['timer', '⏱'], ['tasks', '✓'], ['stats', '📊'], ['settings', '⚙️'], ['notes', '📝']].forEach(([tab, icon]) => {
    registerCommand({
      id: 'tab_' + tab,
      label: 'Ir a ' + tab.charAt(0).toUpperCase() + tab.slice(1),
      icon, section: 'Navegación', action: T(tab),
    });
  });

  registerCommand({ id: 'start',  label: 'Iniciar / Pausar timer [Espacio]', icon: '▶', section: 'Timer',  action: toggleTimer });
  registerCommand({ id: 'reset',  label: 'Reiniciar timer [R]',              icon: '↺', section: 'Timer',  action: resetTimer });
  registerCommand({ id: 'skip',   label: 'Saltar sesión [S]',                icon: '⏭', section: 'Timer',  action: skipSession });

  Object.entries(THEME_META).forEach(([key, m]) => {
    registerCommand({ id: 'theme_' + key, label: 'Tema: ' + m.name, icon: m.emoji, section: 'Temas', action: () => applyTheme(key) });
  });

  [['standard', 'Estándar 25/5'], ['deep', 'Foco profundo 50/10'], ['sprint', 'Sprint 15/3'], ['ultralong', 'Ultra 90/15']].forEach(([k, l]) => {
    registerCommand({ id: 'preset_' + k, label: 'Preset: ' + l, icon: '⚡', section: 'Presets', action: () => window.applyPreset(k) });
  });

  registerCommand({ id: 'fullscreen', label: 'Pantalla completa',    icon: '⛶', section: 'App', action: window.toggleFullscreen });
  registerCommand({ id: 'deepfocus',  label: 'Activar foco profundo', icon: '🎯', section: 'App', action: window.toggleDeepFocus });
}

// ── Boot ───────────────────────────────────────────────────────────────
(async () => {
  try {
    if (!window.Appwrite) {
      throw new Error('Appwrite SDK no cargó. Comprueba tu conexión a internet.');
    }
    if (!window.__APPWRITE_ENDPOINT__ || window.__APPWRITE_ENDPOINT__.includes('TU-APPWRITE')) {
      throw new Error('Faltan las credenciales de Appwrite. Configura el archivo .env del servidor.');
    }

    const { Client, Account, Databases, ID, Query, Permission, Role } = window.Appwrite;
    const _client = new Client()
      .setEndpoint(window.__APPWRITE_ENDPOINT__)
      .setProject(window.__APPWRITE_PROJECT_ID__);
    db.initDb({
      account:    new Account(_client),
      databases:  new Databases(_client),
      ID, Query, Permission, Role,
      databaseId: window.__APPWRITE_DATABASE_ID__,
    });
    initAmbient();
    // Migración: limpiar cola offline de versiones anteriores
    try { localStorage.removeItem('fn_session_queue'); } catch (_) {}

    drawStars();
    window.addEventListener('resize', drawStars);
    ui.applyTheme('ocean');
    spawnCreatures('ocean');
    applyToDOM();

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              ui.showToast('Nueva versión disponible', 'Recargar', () => {
                w.postMessage('SKIP_WAITING');
                window.location.reload();
              });
            }
          });
        });
        // Cuando el SW nuevo toma el control, avisar para recargar
        // (evita errores de funciones eliminadas que siguen en memoria)
        navigator.serviceWorker.addEventListener('message', (evt) => {
          if (evt.data?.type === 'SW_UPDATED') {
            ui.showToast('App actualizada — recarga para aplicar cambios', 'Recargar', () => window.location.reload());
          }
        });
      } catch (e) { console.warn('[SW] Registro fallido (no crítico):', e); }
    }

    _registerCommands();
    _renderShortcutKeys();
    ui.renderTimer(getState());
    ui.renderDailyGoalRing(0, cfg.dailyGoal);

    if (window.location.hash === '#register') window.showAuthTab('register');

    // ── PASO 1: Leer la sesión guardada primero ────────────────────────
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      await handleLogin(session.user);
    }

    // ── PASO 2: Escuchar cambios futuros de auth (cross-tab) ───────────
    db.auth.onStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && state.user?.id !== session.user.id) {
        await handleLogin(session.user);
      } else if (event === 'SIGNED_OUT' && state.user) {
        handleLogout();
      }
    });

    // ── PASO 3: Password recovery via URL params (Appwrite envía userId+secret)
    const _urlParams = new URLSearchParams(window.location.search);
    if (_urlParams.has('userId') && _urlParams.has('secret')) {
      window.__RECOVERY_USER_ID__ = _urlParams.get('userId');
      window.__RECOVERY_SECRET__  = _urlParams.get('secret');
      window.showAuthTab('newpass');
    }

  } catch (err) {
    console.error('[app] Boot error:', err);
    ui.showAuthError('⚠️ ' + err.message);
  }
})();
