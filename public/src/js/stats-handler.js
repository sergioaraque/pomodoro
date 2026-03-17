/**
 * stats-handler.js — Estadísticas, historial y reto semanal.
 *
 * Exporta: loadTodayCount, loadStats
 */

import { cfg }          from './config.js';
import { state }        from './state.js';
import * as db          from './db.js';
import * as ui          from './ui.js';
import { debounceSave } from './settings-handler.js';

let _allHistoryItems  = [];
let _filteredTaskName = '';

// ── loadTodayCount ────────────────────────────────────────────────────

export async function loadTodayCount() {
  if (!state.user) return;
  const { data } = await db.sessions.loadFocus(state.user.id);
  if (!data) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  state.todayCount = data.filter(s => new Date(s.completed_at) >= today).length;
  _checkStreakRisk(data);
  return state.todayCount;
}

// ── loadStats ─────────────────────────────────────────────────────────

export async function loadStats() {
  if (!state.user) return;
  ui.setSyncState('syncing');
  _setStatsLoading(true);

  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado')), 12000)
    );
    const [{ data: fd }, { data: recent }] = await Promise.race([
      Promise.all([
        db.sessions.loadFocus(state.user.id),
        db.sessions.loadRecent(state.user.id),
      ]),
      timeout,
    ]);

    const focusData = fd || [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    state.todayCount = focusData.filter(s => new Date(s.completed_at) >= today).length;
    const totalMins  = focusData.reduce((a, s) => a + s.duration, 0);

    const daySet = new Set(focusData.map(s => new Date(s.completed_at).toDateString()));
    let streak = 0;
    const chk = new Date();
    while (daySet.has(chk.toDateString())) { streak++; chk.setDate(chk.getDate() - 1); }

    const weekCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d  = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const nx = new Date(d); nx.setDate(nx.getDate() + 1);
      weekCounts.push(
        focusData.filter(s => { const sd = new Date(s.completed_at); return sd >= d && sd < nx; }).length
      );
    }

    const heatmap = {};
    focusData.forEach(s => {
      const k = new Date(s.completed_at).toDateString();
      heatmap[k] = (heatmap[k] || 0) + 1;
    });

    _allHistoryItems  = recent || [];
    _filteredTaskName = '';

    ui.renderStats({
      total:        focusData.length,
      today:        state.todayCount,
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

    ui.renderDailyGoalRing(state.todayCount, cfg.dailyGoal);
    _renderWeeklyChallenge(focusData);
    ui.setSyncState('ok');
  } catch (err) {
    console.error('[stats] loadStats error:', err);
    ui.setSyncState('error');
    _showStatsError(err.message);
  } finally {
    _setStatsLoading(false);
  }
}

// ── Privados ──────────────────────────────────────────────────────────

function _checkStreakRisk(focusData) {
  const hour = new Date().getHours();
  if (hour < 17 || state.todayCount > 0) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0);
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const hadYesterday = focusData.some(s => {
    const d = new Date(s.completed_at);
    return d >= yesterday && d < today;
  });
  if (hadYesterday) {
    const banner = document.getElementById('break-banner');
    if (banner) {
      banner.textContent = '🔥 Tu racha está en riesgo — ¡haz al menos 1 pomodoro hoy!';
      banner.className   = 'break-banner lbreak visible';
      setTimeout(() => banner.classList.remove('visible'), 10000);
    }
  }
}

function _setStatsLoading(loading) {
  ['stat-total', 'stat-today', 'stat-streak', 'stat-hours'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (loading) {
      el.dataset.orig    = el.textContent;
      el.style.opacity   = '0.4';
      el.style.animation = 'statPulse 1s ease-in-out infinite';
    } else {
      el.style.opacity   = '';
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
    hist.innerHTML = '<div class="empty-msg" style="color:var(--muted)">⚠️ Error al cargar: ' +
      (msg || 'inténtalo de nuevo') + '</div>';
  }
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

  const bestDay  = Math.max(0, ...Object.values(dayCount));
  const weekTotal = lastWeekSessions.length;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeek = focusData.filter(s => new Date(s.completed_at) >= startOfWeek);

  let challenge, progress, target;
  const isMonday = now.getDay() === 1;
  if (weekTotal === 0 || isMonday) {
    target    = Math.max(5, Math.round(weekTotal * 1.1) || 10);
    challenge = `Completa ${target} pomodoros esta semana`;
    progress  = thisWeek.length;
  } else if (bestDay > 0) {
    target    = bestDay + 1;
    challenge = `Supera tu récord de ${bestDay} pomodoros en un día`;
    progress  = dayCount[now.toDateString()] || 0;
  } else {
    target    = 5;
    challenge = 'Completa 5 pomodoros hoy';
    progress  = state.todayCount;
  }

  const pct  = Math.min(100, Math.round(progress / target * 100));
  const done = progress >= target;
  el.innerHTML =
    '<div class="challenge-header">' +
      '<span class="challenge-title">' + (done ? '🏆 ' : '🎯 ') + 'Reto semanal</span>' +
      (done ? '<span class="challenge-badge">¡Completado!</span>' : '') +
    '</div>' +
    '<div class="challenge-text">' + challenge + '</div>' +
    '<div class="challenge-bar-wrap"><div class="challenge-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="challenge-progress">' + progress + ' / ' + target + (done ? ' ✓' : '') + '</div>';
}

// ── Window handlers ────────────────────────────────────────────────────

window.exportCSV = () => {
  if (!state.user) return;
  db.sessions.loadRecent(state.user.id).then(({ data }) => {
    if (!data || !data.length) return alert('Sin datos para exportar.');
    const rows = [['Fecha', 'Modo', 'Duracion (min)', 'Tarea']];
    data.forEach(s => {
      const d = new Date(s.completed_at).toLocaleString('es-ES');
      rows.push([d, s.mode, s.duration, s.task_name || '']);
    });
    const CRLF = String.fromCharCode(13, 10);
    const csv  = rows
      .map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))
      .join(CRLF);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'focusnature-sesiones.csv'; a.click();
    URL.revokeObjectURL(url);
  });
};

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

let _notesTimer = null;
window.onQuickNotesChange = () => {
  clearTimeout(_notesTimer);
  _notesTimer = setTimeout(() => { if (state.user) debounceSave(); }, 1000);
};
