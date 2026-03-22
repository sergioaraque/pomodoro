/**
 * stats-handler.js — Estadísticas, historial y reto semanal.
 *
 * Exporta: loadTodayCount, loadStats, invalidateStatsCache
 */

import { cfg }          from './config.js';
import { state }        from './state.js';
import * as db          from './db.js';
import * as ui          from './ui.js';
import { debounceSave } from './settings-handler.js';
import { ACHIEVEMENTS, loadAchievements, checkNewAchievements } from './achievements.js';
import { renderForest } from './forest.js';

let _allHistoryItems  = [];
let _filteredTaskName = '';
let _dateRange        = 'all';

// Caché de stats: se muestra inmediatamente en cada visita al tab
let _cachedStats  = null;
let _cachedStreak = 0;

/** Fuerza recarga completa en la próxima visita al tab de stats. */
export function invalidateStatsCache() { _cachedStats = null; }

// ── loadTodayCount ────────────────────────────────────────────────────

export async function loadTodayCount() {
  if (!state.user) return;
  const { data } = await db.sessions.loadFocus(state.user.id);
  if (!data) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  state.todayCount = data.filter(s => new Date(s.completed_at) >= today).length;

  // Calcular racha para el badge del timer (sin esperar a abrir Stats)
  const daySet = new Set(data.map(s => new Date(s.completed_at).toDateString()));
  let streak = 0;
  const chk  = new Date();
  while (daySet.has(chk.toDateString())) { streak++; chk.setDate(chk.getDate() - 1); }
  ui.updateStreakBadge(streak);

  _checkStreakRisk(data);
  return state.todayCount;
}

// ── loadStats ─────────────────────────────────────────────────────────

export async function loadStats() {
  if (!state.user) return;

  // Si hay caché, mostrar inmediatamente mientras recargamos en fondo
  if (_cachedStats) {
    _renderStats(_cachedStats);
    _refreshStatsBackground();
    return;
  }

  // Primera carga: mostrar estado de carga y esperar
  _setStatsLoading(true);
  ui.setSyncState('syncing');
  await _fetchAndRender();
}

async function _refreshStatsBackground() {
  // Recarga silenciosa sin bloquear la UI
  try {
    const [{ data: fd }, { data: recent }] = await Promise.all([
      db.sessions.loadFocus(state.user.id),
      db.sessions.loadRecent(state.user.id),
    ]);
    const built = _buildStats(fd, recent);
    if (built) {
      _cachedStats = built;
      _renderStats(built);
      ui.setSyncState('ok');
    }
  } catch (_) {
    // Fallo silencioso — ya hay datos de caché visibles
    ui.setSyncState('error');
  }
}

async function _fetchAndRender() {
  try {
    const [{ data: fd }, { data: recent }] = await Promise.all([
      db.sessions.loadFocus(state.user.id),
      db.sessions.loadRecent(state.user.id),
    ]);
    const built = _buildStats(fd, recent);
    if (built) {
      _cachedStats = built;
      _renderStats(built);
    }
    ui.setSyncState('ok');
  } catch (err) {
    console.error('[stats] loadStats error:', err);
    ui.setSyncState('error');
    _showStatsError(err?.message || 'Error al cargar estadísticas');
  } finally {
    _setStatsLoading(false);
  }
}

function _buildStats(fd, recent) {
  const focusData = fd || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const todayCount = focusData.filter(s => new Date(s.completed_at) >= today).length;
  state.todayCount = todayCount;

  const totalMins = focusData.reduce((a, s) => a + s.duration, 0);

  const daySet = new Set(focusData.map(s => new Date(s.completed_at).toDateString()));
  let streak = 0;
  const chk = new Date();
  while (daySet.has(chk.toDateString())) { streak++; chk.setDate(chk.getDate() - 1); }

  // Best streak (all-time)
  const sortedDays = [...daySet].map(d => new Date(d)).sort((a, b) => a - b);
  let bestStreak = 0, tempStreak = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    tempStreak = (i > 0 && (sortedDays[i] - sortedDays[i-1]) / 86400000 === 1) ? tempStreak + 1 : 1;
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  }

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

  // Productividad por hora del día
  const hourData = new Array(24).fill(0);
  focusData.forEach(s => { hourData[new Date(s.completed_at).getHours()]++; });

  // Label breakdown — from sessions matched to current tasks
  const labelData = {};
  focusData.forEach(s => {
    if (!s.task_id) return;
    const task = state.tasks.find(t => t.id === s.task_id);
    if (task?.label) labelData[task.label] = (labelData[task.label] || 0) + 1;
  });

  const bestDay         = Object.keys(heatmap).length ? Math.max(...Object.values(heatmap)) : 0;
  const hasEarlySession = focusData.some(s => new Date(s.completed_at).getHours() < 8);
  const hasLateSession  = focusData.some(s => new Date(s.completed_at).getHours() >= 22);

  _allHistoryItems  = recent || [];
  _filteredTaskName = '';

  return {
    total:       focusData.length,
    today:       todayCount,
    streak,
    bestStreak,
    bestDay,
    hasEarlySession,
    hasLateSession,
    dailyGoal:   cfg.dailyGoal,
    hours:       (totalMins / 60).toFixed(1) + 'h',
    weekData:    weekCounts,
    heatmapData: heatmap,
    history:     recent || [],
    focusData,
    labelData,
    hourData,
    insights:    _buildInsights(focusData, cfg.dailyGoal),
  };
}

function _buildInsights(focusData, dailyGoal) {
  if (focusData.length < 3) return null;

  // Mejor hora del día
  const hourCounts = new Array(24).fill(0);
  focusData.forEach(s => { hourCounts[new Date(s.completed_at).getHours()]++; });
  const bestHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Mejor día de la semana
  const dayCounts = new Array(7).fill(0);
  focusData.forEach(s => { dayCounts[new Date(s.completed_at).getDay()]++; });
  const bestDow = dayCounts.indexOf(Math.max(...dayCounts));

  // Pomodoros por semana en las últimas 4 semanas
  const now = new Date();
  const weekCounts4 = Array.from({ length: 4 }, (_, i) => {
    const wAgo  = 3 - i;
    const start = new Date(now); start.setDate(start.getDate() - (wAgo + 1) * 7); start.setHours(0,0,0,0);
    const end   = new Date(now); end.setDate(end.getDate()   - wAgo * 7);         end.setHours(0,0,0,0);
    return focusData.filter(s => { const d = new Date(s.completed_at); return d >= start && d < end; }).length;
  });

  // Consistencia en los últimos 30 días
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30); d30.setHours(0,0,0,0);
  const daySet30 = new Set(
    focusData.filter(s => new Date(s.completed_at) >= d30).map(s => new Date(s.completed_at).toDateString())
  );
  const consistency30 = Math.round((daySet30.size / 30) * 100);

  // Meta diaria cumplida en los últimos 30 días
  const heatmap30 = {};
  focusData.filter(s => new Date(s.completed_at) >= d30).forEach(s => {
    const k = new Date(s.completed_at).toDateString();
    heatmap30[k] = (heatmap30[k] || 0) + 1;
  });
  const goalDays = Object.values(heatmap30).filter(c => c >= (dailyGoal || 1)).length;
  const goalRate = Math.round((goalDays / 30) * 100);

  return { bestHour, bestDow, weekCounts4, consistency30, goalRate };
}

function _renderStats(built) {
  ui.renderStats({
    total:        built.total,
    today:        built.today,
    streak:       built.streak,
    bestStreak:   built.bestStreak,
    bestDay:      built.bestDay,
    hours:        built.hours,
    weekData:     built.weekData,
    heatmapData:  built.heatmapData,
    historyItems: built.history,
    dailyGoal:    cfg.dailyGoal,
    onDeleteHistory: async (id) => {
      ui.setSyncState('syncing');
      const { error } = await db.sessions.remove(id);
      ui.setSyncState(error ? 'error' : 'ok');
      if (!error) {
        // Invalida caché y recarga
        _cachedStats = null;
        await _fetchAndRender();
      }
    },
  });

  ui.renderDailyGoalRing(built.today, cfg.dailyGoal);
  ui.renderHourChart(built.hourData);
  ui.renderLabelStats(built.labelData);
  ui.renderInsights(built.insights);
  // Re-aplicar filtros de historial si hay activos
  if (_filteredTaskName || _dateRange !== 'all') _applyHistoryFilters();
  renderForest(built.focusData);
  _renderWeeklyChallenge(built.focusData);
  _checkStreakRisk(built.focusData);
  // Actualizar el streak en la función de weekly review
  _cachedStreak = built.streak;

  // Actualizar badge de racha en el timer
  ui.updateStreakBadge(built.streak);

  // Toasts de hitos de racha
  if (state.user && built.streak > 0) {
    try {
      const prevKey    = 'fn_streak_prev_' + state.user.id;
      const prevStreak = parseInt(localStorage.getItem(prevKey) || '0', 10);
      if (built.streak > prevStreak) {
        localStorage.setItem(prevKey, built.streak);
        const MILESTONES = { 3:'🌱 ¡3 días de racha! El hábito comienza.', 7:'💪 ¡Una semana de racha!', 14:'🔥🔥 ¡2 semanas sin parar!', 21:'🏅 ¡21 días — ya es un hábito real!', 30:'🌟 ¡Un mes de racha! Impresionante.', 60:'🤖 ¡60 días! Eres una máquina.', 100:'👑 ¡100 días de racha! Leyenda.' };
        if (MILESTONES[built.streak]) ui.showToast(MILESTONES[built.streak]);
      }
    } catch (_) {}
  }

  if (state.user) {
    const unlocked = loadAchievements(state.user.id);
    const newly    = checkNewAchievements(built, state.user.id, unlocked);
    newly.forEach(a => ui.showToast(`${a.icon} Logro desbloqueado: ${a.name}`));
    ui.renderAchievements(ACHIEVEMENTS, unlocked, newly);
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
    // Delay para no solaparse con el banner de bienvenida (4s) al hacer login
    setTimeout(() => {
      const banner = document.getElementById('break-banner');
      if (banner && !banner.classList.contains('visible')) {
        banner.textContent = '🔥 Tu racha está en riesgo — ¡haz al menos 1 pomodoro hoy!';
        banner.className   = 'break-banner lbreak visible';
        setTimeout(() => banner.classList.remove('visible'), 10000);
      }
    }, 4500);
  }
}

function _setStatsLoading(loading) {
  ['stat-total', 'stat-today', 'stat-streak', 'stat-hours'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (loading) {
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
    hist.innerHTML =
      '<div class="empty-msg" style="color:var(--muted)">' +
      '⚠️ ' + (msg || 'Error al cargar') +
      ' <button onclick="window._retryStats()" style="margin-left:8px;background:none;border:1px solid var(--accent);color:var(--accent);border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer">Reintentar</button>' +
      '</div>';
  }
}

window._retryStats = async () => {
  _cachedStats = null;
  _setStatsLoading(true);
  ui.setSyncState('syncing');
  await _fetchAndRender();
};

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

  const bestDay   = Math.max(0, ...Object.values(dayCount));
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
    if (!data || !data.length) return ui.showToast('Sin datos para exportar.');
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
  }).catch(err => { console.error('[exportCSV]', err); ui.showToast('Error al exportar sesiones.'); });
};

function _applyHistoryFilters() {
  let filtered = _allHistoryItems;
  if (_dateRange !== 'all') {
    const cutoff = new Date();
    if (_dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
    else if (_dateRange === 'week')  cutoff.setDate(cutoff.getDate() - 7);
    else if (_dateRange === 'month') cutoff.setDate(cutoff.getDate() - 30);
    filtered = filtered.filter(s => new Date(s.completed_at) >= cutoff);
  }
  if (_filteredTaskName) {
    filtered = filtered.filter(s => (s.task_name || '').toLowerCase().includes(_filteredTaskName));
  }
  ui.updateHistoryList(filtered, async (id) => {
    ui.setSyncState('syncing');
    const { error } = await db.sessions.remove(id);
    ui.setSyncState(error ? 'error' : 'ok');
    if (!error) { _cachedStats = null; await _fetchAndRender(); }
  });
}

window.filterHistory = (val) => {
  _filteredTaskName = (val || '').toLowerCase().trim();
  _applyHistoryFilters();
};

window.setHistoryRange = (range) => {
  _dateRange = range;
  document.querySelectorAll('.hist-range-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.range === range)
  );
  _applyHistoryFilters();
};

// ── Weekly Review ──────────────────────────────────────────────────────

export function openWeeklyReview() {
  if (_cachedStats) {
    _showWeeklyReview(_cachedStats.focusData, _cachedStreak);
  } else if (state.user) {
    db.sessions.loadFocus(state.user.id).then(({ data }) => {
      if (data) _showWeeklyReview(data, _cachedStreak);
    }).catch(err => { console.error('[weeklyReview]', err); });
  }
}
window.openWeeklyReview = openWeeklyReview;

function _showWeeklyReview(focusData, currentStreak) {
  const now  = new Date();

  // Esta semana: lunes a hoy
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  // Semana pasada
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeekData = focusData.filter(s => new Date(s.completed_at) >= startOfWeek);
  const lastWeekData = focusData.filter(s => {
    const d = new Date(s.completed_at);
    return d >= startOfLastWeek && d < startOfWeek;
  });

  const thisTotal = thisWeekData.length;
  const lastTotal = lastWeekData.length;
  const pctChange = lastTotal > 0 ? Math.round((thisTotal - lastTotal) / lastTotal * 100) : null;

  const totalMins = thisWeekData.reduce((a, s) => a + s.duration, 0);
  const hours     = (totalMins / 60).toFixed(1) + 'h';

  // Distribución por día (0=Lun…6=Dom)
  const dayCounts = new Array(7).fill(0);
  thisWeekData.forEach(s => {
    dayCounts[(new Date(s.completed_at).getDay() + 6) % 7]++;
  });

  const dayFullNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const dayNames     = ['L','M','X','J','V','S','D'];
  const maxDayIdx    = dayCounts.indexOf(Math.max(...dayCounts));
  const bestDayName  = dayCounts[maxDayIdx] > 0 ? dayFullNames[maxDayIdx] : null;

  // Top tareas por nombre
  const taskCounts = {};
  thisWeekData.forEach(s => {
    if (!s.task_name) return;
    taskCounts[s.task_name] = (taskCounts[s.task_name] || 0) + 1;
  });
  const topTasks = Object.entries(taskCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Rango de fechas
  const endDate = new Date(startOfWeek); endDate.setDate(endDate.getDate() + 6);
  const fmt     = d => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const dateRange = `${fmt(startOfWeek)} – ${fmt(endDate)}`;

  ui.showWeeklyReview({
    dateRange, thisTotal, lastTotal, pctChange, hours,
    streak: currentStreak, dayCounts, dayNames, bestDayName, topTasks,
  });
}

// ── Notes ──────────────────────────────────────────────────────────────

let _notesTimer = null;
window.onQuickNotesChange = () => {
  clearTimeout(_notesTimer);
  _notesTimer = setTimeout(() => { if (state.user) debounceSave(); }, 1000);
};
