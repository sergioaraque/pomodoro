/**
 * tasks-handler.js — Carga, renderizado y gestión de tareas.
 *
 * Exporta: loadTasks, renderTasks, updateTaskBadge, taskHandlers
 */

import { cfg }                       from './config.js';
import { state }                     from './state.js';
import * as db                       from './db.js';
import * as ui                       from './ui.js';
import { setTask, clearTask }        from './timer.js';

// ── Load / Render ─────────────────────────────────────────────────────

let _sortMode = 'manual';

function _checkDailyReset() {
  if (!state.user) return;
  const today    = new Date().toDateString();
  const resetKey = 'fn_recurring_reset_' + state.user.id;
  if (localStorage.getItem(resetKey) === today) return;
  localStorage.setItem(resetKey, today);
  state.tasks.forEach(t => {
    if (t.recurring && (t.done || t.pomodoros > 0)) {
      t.done = false;
      t.pomodoros = 0;
      db.tasks.update(t.id, { done: false, pomodoros: 0 });
    }
  });
}

export async function loadTasks() {
  const { data } = await db.tasks.loadAll(state.user.id);
  if (data) state.tasks = data;
  _checkDailyReset();
  renderTasks();
}

export function renderTasks() {
  let tasks = [...state.tasks];
  if      (_sortMode === 'name')      tasks.sort((a, b) => a.name.localeCompare(b.name));
  else if (_sortMode === 'label')     tasks.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  else if (_sortMode === 'estimate')  tasks.sort((a, b) => (b.estimate || 0) - (a.estimate || 0));
  else if (_sortMode === 'pomodoros') tasks.sort((a, b) => (b.pomodoros || 0) - (a.pomodoros || 0));
  const recurringSet = new Set(state.tasks.filter(t => t.recurring).map(t => t.id));
  ui.renderTasks(tasks, state.activeTaskId, taskHandlers, recurringSet);
  const clearRow = document.getElementById('clear-done-row');
  if (clearRow) clearRow.style.display = state.tasks.some(t => t.done) ? '' : 'none';
  const sortSel = document.getElementById('task-sort-sel');
  if (sortSel) sortSel.value = _sortMode;
}

export function updateTaskBadge(task) {
  if (!task) { ui.setCurrentTaskBadge(null); return; }
  const remaining = Math.max(0, (task.estimate || 0) - (task.pomodoros || 0));
  const mins      = remaining * cfg.focus;
  const suffix    = remaining > 0 ? ` · ~${remaining} 🍅 restantes (${mins} min)` : '';
  ui.setCurrentTaskBadge(task.name + suffix);
}

// ── Task handlers (callbacks para ui.renderTasks) ─────────────────────

export const taskHandlers = {
  onFocus: (id) => {
    state.activeTaskId = id;
    const t = state.tasks.find(t => t.id === id);
    setTask(id, t?.name || null);
    updateTaskBadge(t);
    renderTasks();
  },

  onToggle: async (id) => {
    const t = state.tasks.find(t => t.id === id);
    if (!t) return;
    t.done = !t.done;
    if (t.done && state.activeTaskId === id) {
      state.activeTaskId = null;
      clearTask();
      ui.setCurrentTaskBadge(null);
    }
    renderTasks();
    if (state.user) {
      ui.setSyncState('syncing');
      const { error } = await db.tasks.update(id, { done: t.done });
      ui.setSyncState(error ? 'error' : 'ok');
    }
  },

  onDelete: async (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    state.tasks = state.tasks.filter(t => t.id !== id);
    if (state.activeTaskId === id) {
      state.activeTaskId = null;
      clearTask();
      ui.setCurrentTaskBadge(null);
    }
    renderTasks();

    let undone = false;
    const label = (task.done ? '✓ ' : '') +
      (task.name.length > 28 ? task.name.slice(0, 28) + '…' : task.name) + ' eliminada';
    ui.showToast(label, 'Deshacer', async () => {
      undone = true;
      state.tasks.splice(0, 0, task);
      state.tasks.sort((a, b) => (a.position || 0) - (b.position || 0));
      renderTasks();
    });

    setTimeout(async () => {
      if (undone) return;
      if (state.user) {
        ui.setSyncState('syncing');
        const { error } = await db.tasks.remove(id);
        ui.setSyncState(error ? 'error' : 'ok');
      }
    }, 4200);
  },

  onSaveNotes: async (id, notes) => {
    const t = state.tasks.find(t => t.id === id);
    if (!t) return;
    t.notes = notes;
    if (state.user) {
      ui.setSyncState('syncing');
      const { error } = await db.tasks.update(id, { notes });
      ui.setSyncState(error ? 'error' : 'ok');
    }
  },

  onToggleRecurring: async (id) => {
    const t = state.tasks.find(t => t.id === id);
    if (!t) return;
    t.recurring = !t.recurring;
    renderTasks();
    if (state.user) {
      ui.setSyncState('syncing');
      const { error } = await db.tasks.update(id, { recurring: t.recurring });
      ui.setSyncState(error ? 'error' : 'ok');
    }
  },
};

// ── Drag and drop ─────────────────────────────────────────────────────

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
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over', 'dragging'));
  const srcIdx = state.tasks.findIndex(t => t.id === srcId);
  const tgtIdx = state.tasks.findIndex(t => t.id === targetId);
  if (srcIdx === -1 || tgtIdx === -1) return;
  const [moved] = state.tasks.splice(srcIdx, 1);
  state.tasks.splice(tgtIdx, 0, moved);
  renderTasks();
  if (state.user) {
    ui.setSyncState('syncing');
    try {
      await Promise.all(state.tasks.map((t, i) => db.tasks.update(t.id, { position: i })));
      ui.setSyncState('ok');
      ui.showToast('Orden guardado');
    } catch (_) {
      ui.setSyncState('error');
    }
  }
};

window.setSortMode = (mode) => {
  _sortMode = mode;
  renderTasks();
};

window.loadTaskHistory = async (taskId, btn) => {
  if (!state.user) return;
  const container = document.getElementById('task-hist-' + taskId);
  if (!container) return;
  const isOpen = container.classList.toggle('open');
  if (!isOpen) return;
  container.innerHTML = '<div style="padding:6px 8px;font-size:11px;color:var(--muted)">Cargando…</div>';
  const { data } = await db.sessions.loadForTask(state.user.id, taskId);
  if (!data?.length) {
    container.innerHTML = '<div style="padding:6px 8px;font-size:11px;color:var(--muted)">Sin sesiones registradas aún.</div>';
    return;
  }
  container.innerHTML = data.map(s => {
    const dt = new Date(s.completed_at);
    const ds = dt.toLocaleDateString('es-ES', { day:'numeric', month:'short' })
             + ' ' + dt.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
    return `<div style="font-size:11px;color:var(--muted);padding:2px 8px">🍅 ${s.duration}min · ${ds}</div>`;
  }).join('');
};

window.clearDoneTasks = async () => {
  const done = state.tasks.filter(t => t.done);
  if (!done.length) return;
  state.tasks = state.tasks.filter(t => !t.done);
  if (done.some(t => t.id === state.activeTaskId)) {
    state.activeTaskId = null;
    clearTask();
    ui.setCurrentTaskBadge(null);
  }
  renderTasks();
  if (state.user) {
    ui.setSyncState('syncing');
    const results = await Promise.all(done.map(t => db.tasks.remove(t.id)));
    ui.setSyncState(results.some(r => r.error) ? 'error' : 'ok');
  }
  ui.showToast(`${done.length} tarea${done.length > 1 ? 's' : ''} completada${done.length > 1 ? 's' : ''} eliminada${done.length > 1 ? 's' : ''}`);
};

export async function createTask(name, est = 0, label = '') {
  if (!name || !state.user) return null;
  ui.setSyncState('syncing');
  const { data, error } = await db.tasks.create(state.user.id, name, est, label);
  if (!error && data) {
    state.tasks.unshift({ id: data.id, name: data.name, done: false, pomodoros: 0, notes: '', estimate: est, label, recurring: false });
    renderTasks();
    ui.setSyncState('ok');
    return data;
  }
  ui.setSyncState('error');
  return null;
}

window.addTask = async () => {
  const name = ui.getTaskInputValue();
  if (!name || !state.user) return;
  const est   = parseInt(document.getElementById('task-est-inp')?.value || '0') || 0;
  const label = document.getElementById('task-label-sel')?.value || '';
  ui.clearTaskInput();
  const estInp = document.getElementById('task-est-inp');
  if (estInp) estInp.value = '';
  ui.setSyncState('syncing');
  const { data, error } = await db.tasks.create(state.user.id, name, est, label);
  if (!error && data) {
    state.tasks.unshift({ id: data.id, name: data.name, done: false, pomodoros: 0, notes: '', estimate: est, label, recurring: false });
    renderTasks();
    ui.setSyncState('ok');
  } else {
    ui.setSyncState('error');
  }
};
