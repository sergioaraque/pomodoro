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
import { applyTheme, THEME_META }         from './settings-handler.js';
import { renderTasks, updateTaskBadge }   from './tasks-handler.js';
import { loadTodayCount, loadStats }       from './stats-handler.js';
import { queueSession, flushQueue,
         updateSyncBadge }               from './sync.js';
import { updateFavicon, resetFavicon }  from './favicon.js';

// ── Globals para onclick inline ────────────────────────────────────────
window.spawnCreatures = spawnCreatures;
window.drawStars      = drawStars;
// Wrapper que actualiza el favicon al pausar (onTick no se llama cuando está parado)
window.toggleTimer = () => {
  toggleTimer();
  const s = getState();
  if (!s.running) updateFavicon(s.secondsLeft, s.totalSeconds, s.mode, false);
};
window.resetTimer     = resetTimer;
window.skipSession    = skipSession;

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
        queueSession({ userId: state.user.id, mode: finishedMode, duration: durationMin, taskId, taskName });
        updateSyncBadge();
        ui.setSyncState('error');
        ui.showToast('Sin conexión — sesión guardada localmente');
      } else {
        ui.setSyncState('ok');
        flushQueue(state.user.id);
      }
    }

    if (finishedMode === 'focus') {
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
    await flushQueue(state.user.id);
    await loadTodayCount();
    ui.setSyncState('ok');
    ui.showToast('Sincronizado ✓');
  } catch {
    ui.setSyncState('error');
    ui.showToast('Error de sincronización');
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
  if (e.key === ' ')               { e.preventDefault(); window.toggleTimer(); }
  if (e.key.toLowerCase() === 'r') { e.preventDefault(); resetTimer(); }
  if (e.key.toLowerCase() === 's') { e.preventDefault(); skipSession(); }
  if (e.key === 'Escape')          { closePalette(); }
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
    if (!window.supabase) {
      throw new Error('Supabase no cargó. Comprueba tu conexión a internet.');
    }
    if (!window.__SUPABASE_URL__ || window.__SUPABASE_URL__.includes('TU-PROYECTO')) {
      throw new Error('Faltan las credenciales de Supabase. Configura el archivo .env del servidor.');
    }

    const { createClient } = window.supabase;
    db.initDb(createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON__));
    initAmbient();

    drawStars();
    window.addEventListener('resize', drawStars);
    ui.applyTheme('ocean');
    spawnCreatures('ocean');
    applyToDOM();

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
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

    // Indicador de conexión
    window.addEventListener('offline', () => {
      ui.showToast('📵 Sin conexión — las sesiones se guardarán localmente');
      ui.setSyncState('error');
    });
    window.addEventListener('online', () => {
      ui.showToast('🌐 Conexión restaurada');
      if (state.user) setTimeout(() => flushQueue(state.user.id), 500);
    });

    _registerCommands();
    ui.renderTimer(getState());
    ui.renderDailyGoalRing(0, cfg.dailyGoal);

    if (window.location.hash === '#register') window.showAuthTab('register');

    // ── PASO 1: Leer la sesión guardada primero ────────────────────────
    // Usamos getSession() antes de registrar el listener para no depender
    // de qué evento inicial dispara Supabase (INITIAL_SESSION vs SIGNED_IN).
    // Esto garantiza que un F5 con sesión válida siempre funcione.
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      await handleLogin(session.user);
    }

    // ── PASO 2: Escuchar cambios futuros de auth ───────────────────────
    db.auth.onStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Solo actuar si cambia el usuario (p. ej., login en otra pestaña)
        if (session?.user && state.user?.id !== session.user.id) {
          await handleLogin(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        // Solo desloguear si realmente estábamos autenticados
        if (state.user) handleLogout();
      } else if (event === 'PASSWORD_RECOVERY') {
        window.showAuthTab('newpass');
      }
      // INITIAL_SESSION no se maneja aquí; se gestiona con getSession() arriba.
    });

  } catch (err) {
    console.error('[app] Boot error:', err);
    ui.showAuthError('⚠️ ' + err.message);
  }
})();
