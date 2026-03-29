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
import { getNotesMap }               from './session-notes.js';

const _esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

// ── Load / Render ─────────────────────────────────────────────────────

let _sortMode = 'manual';

async function _checkDailyReset() {
  if (!state.user) return;
  try {
    const today    = new Date().toDateString();
    const resetKey = 'fn_recurring_reset_' + state.user.id;
    if (localStorage.getItem(resetKey) === today) return;
    localStorage.setItem(resetKey, today);
    await Promise.all(state.tasks
      .filter(t => t.recurring && (t.done || t.pomodoros > 0))
      .map(t => {
        t.done = false;
        t.pomodoros = 0;
        return db.tasks.update(t.id, { done: false, pomodoros: 0 });
      })
    );
  } catch (err) {
    console.error('[daily reset]', err);
  }
}

export async function loadTasks() {
  const { data } = await db.tasks.loadAll(state.user.id);
  if (data) state.tasks = data;
  _checkDailyReset();
  _restoreActiveTask();
  renderTasks();
}

function _activeKey() { return 'fn_active_task_' + (state.user?.id || ''); }

function _restoreActiveTask() {
  if (!state.user) return;
  const saved = localStorage.getItem(_activeKey());
  if (!saved) return;
  const t = state.tasks.find(t => t.id === saved && !t.done);
  if (t) {
    state.activeTaskId = t.id;
    setTask(t.id, t.name);
    updateTaskBadge(t);
  } else {
    localStorage.removeItem(_activeKey());
  }
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

// ── Helpers privados ──────────────────────────────────────────────────

function _doDelete(id, task) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  if (state.activeTaskId === id) {
    state.activeTaskId = null;
    clearTask();
    ui.setCurrentTaskBadge(null);
    if (state.user) localStorage.removeItem(_activeKey());
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
}

// ── Task handlers (callbacks para ui.renderTasks) ─────────────────────

export const taskHandlers = {
  onFocus: (id) => {
    state.activeTaskId = id;
    if (state.user) localStorage.setItem(_activeKey(), id);
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
      if (state.user) localStorage.removeItem(_activeKey());
    }
    renderTasks();
    if (state.user) {
      ui.setSyncState('syncing');
      const { error } = await db.tasks.update(id, { done: t.done });
      ui.setSyncState(error ? 'error' : 'ok');
    }
  },

  onDelete: (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    if ((task.pomodoros || 0) > 0) {
      const name = task.name.length > 32 ? task.name.slice(0, 32) + '…' : task.name;
      ui.showConfirm(
        `"${name}" tiene ${task.pomodoros} 🍅 registrados. ¿Eliminar igualmente?`,
        'Eliminar',
        () => _doDelete(id, task)
      );
    } else {
      _doDelete(id, task);
    }
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
      ui.showToast('Orden guardado', null, null, 'success');
    } catch (_) {
      ui.setSyncState('error');
      ui.showToast('No se pudo guardar el orden', null, null, 'error');
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
  const notesMap = state.user ? getNotesMap(state.user.id) : {};
  container.innerHTML = data.map(s => {
    const dt   = new Date(s.completed_at);
    const ds   = dt.toLocaleDateString('es-ES', { day:'numeric', month:'short' })
               + ' ' + dt.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
    const note = notesMap[s.id]?.note;
    const noteHtml = note
      ? `<span style="font-style:italic;opacity:0.75;margin-left:4px">— ${_esc(note)}</span>`
      : '';
    return `<div style="font-size:11px;color:var(--muted);padding:2px 8px">🍅 ${s.duration}min · ${ds}${noteHtml}</div>`;
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

// ── Plan del día ──────────────────────────────────────────────────────

function _dpRow(t, i, total) {
  const rem  = Math.max(0, (t.estimate || 0) - (t.pomodoros || 0));
  const safe = t.name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const isActive = state.activeTaskId === t.id;
  const meta = rem > 0
    ? `${t.pomodoros || 0}/${t.estimate} 🍅 · ~${rem * cfg.focus} min`
    : t.pomodoros > 0 ? `${t.pomodoros} 🍅` : '';
  return `<div class="dp-row">
    <div class="dp-order">${i + 1}</div>
    <div class="dp-info">
      <div class="dp-name">${safe}</div>
      ${meta ? `<div class="dp-rem">${meta}</div>` : ''}
    </div>
    <div class="dp-btns">
      <button class="dp-arrow" data-move="-1" data-id="${t.id}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
      <button class="dp-arrow" data-move="1"  data-id="${t.id}" ${i === total - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button>
      <button class="dp-act${isActive ? ' dp-act-on' : ''}" data-focus="${t.id}">
        ${isActive ? '✓ Activa' : 'Activar'}
      </button>
    </div>
  </div>`;
}

export function openDailyPlan() {
  const existing = document.getElementById('daily-plan-modal');
  if (existing) { existing.classList.add('open'); return; }

  const modal = document.createElement('div');
  modal.id    = 'daily-plan-modal';
  modal.className = 'dp-overlay';

  const pending  = state.tasks.filter(t => !t.done);
  const dateStr  = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const totalEst = pending.reduce((a, t) => a + Math.max(0, (t.estimate || 0) - (t.pomodoros || 0)), 0);
  const estHtml  = totalEst > 0
    ? `<span class="dp-total">${totalEst} 🍅 · ~${Math.round(totalEst * cfg.focus / 60 * 10) / 10}h estimadas</span>`
    : '';

  modal.innerHTML = `
    <div class="dp-card">
      <div class="dp-header">
        <div>
          <div class="dp-title">📋 Plan del día</div>
          <div class="dp-date">${dateStr} ${estHtml}</div>
        </div>
        <button class="dp-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="dp-list" id="dp-list">
        ${pending.length === 0
          ? '<div class="dp-empty">Sin tareas pendientes — añade tareas primero.</div>'
          : pending.map((t, i) => _dpRow(t, i, pending.length)).join('')}
      </div>
      ${pending.length > 0 ? `<div class="dp-footer">
        <button class="dp-start" id="dp-start-btn">▶ Empezar con la primera</button>
      </div>` : ''}
    </div>`;

  document.body.appendChild(modal);

  const list = document.getElementById('dp-list');

  function rerender() {
    list.innerHTML = pending.map((t, i) => _dpRow(t, i, pending.length)).join('');
  }

  modal.addEventListener('click', async e => {
    // Close
    if (e.target === modal || e.target.classList.contains('dp-close')) {
      modal.classList.remove('open');
      return;
    }
    // Reorder
    const arrow = e.target.closest('[data-move]');
    if (arrow) {
      const id  = arrow.dataset.id;
      const dir = parseInt(arrow.dataset.move);
      const idx = pending.findIndex(t => t.id === id);
      const nx  = idx + dir;
      if (nx >= 0 && nx < pending.length) {
        [pending[idx], pending[nx]] = [pending[nx], pending[idx]];
        rerender();
        if (state.user) {
          pending.forEach((t, i) => { t.position = i; });
          state.tasks.sort((a, b) => {
            const ai = pending.findIndex(p => p.id === a.id);
            const bi = pending.findIndex(p => p.id === b.id);
            return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi);
          });
          renderTasks();
          Promise.all(pending.map((t, i) => db.tasks.update(t.id, { position: i })))
            .catch(err => { console.error('[daily plan reorder]', err); ui.setSyncState('error'); });
        }
      }
      return;
    }
    // Activate task
    const act = e.target.closest('[data-focus]');
    if (act) {
      taskHandlers.onFocus(act.dataset.focus);
      modal.classList.remove('open');
    }
  });

  const startBtn = document.getElementById('dp-start-btn');
  if (startBtn && pending.length) {
    startBtn.onclick = () => { taskHandlers.onFocus(pending[0].id); modal.classList.remove('open'); };
  }

  requestAnimationFrame(() => modal.classList.add('open'));
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
    ui.showToast('No se pudo crear la tarea — comprueba tu conexión', null, null, 'error');
  }
};
