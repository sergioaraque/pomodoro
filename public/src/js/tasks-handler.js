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

export async function loadTasks() {
  const { data } = await db.tasks.loadAll(state.user.id);
  if (data) state.tasks = data;
  renderTasks();
}

export function renderTasks() {
  ui.renderTasks(state.tasks, state.activeTaskId, taskHandlers);
  const clearRow = document.getElementById('clear-done-row');
  if (clearRow) clearRow.style.display = state.tasks.some(t => t.done) ? '' : 'none';
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
    await Promise.all(state.tasks.map((t, i) => db.tasks.update(t.id, { position: i })));
    ui.setSyncState('ok');
  }
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
    await Promise.all(done.map(t => db.tasks.remove(t.id)));
    ui.setSyncState('ok');
  }
  ui.showToast(`${done.length} tarea${done.length > 1 ? 's' : ''} completada${done.length > 1 ? 's' : ''} eliminada${done.length > 1 ? 's' : ''}`);
};

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
    state.tasks.unshift({ id: data.id, name: data.name, done: false, pomodoros: 0, notes: '', estimate: est, label });
    renderTasks();
    ui.setSyncState('ok');
  } else {
    ui.setSyncState('error');
  }
};
