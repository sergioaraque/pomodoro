/**
 * sync.js — Cola offline de sesiones y estado de sincronización.
 * Persiste sesiones fallidas en localStorage y las reintenta cuando
 * hay conexión disponible.
 */

import * as db  from './db.js';
import * as ui  from './ui.js';

const SESSION_QUEUE_KEY = 'fn_session_queue';

/** Guarda una sesión fallida en la cola offline. */
export function queueSession(session) {
  try {
    const q = JSON.parse(localStorage.getItem(SESSION_QUEUE_KEY) || '[]');
    q.push({ ...session, queuedAt: Date.now() });
    localStorage.setItem(SESSION_QUEUE_KEY, JSON.stringify(q));
    updateSyncBadge();
  } catch (e) { console.warn('[sync] Queue error:', e); }
}

/** Intenta enviar todas las sesiones encoladas a Supabase. */
export async function flushQueue(userId) {
  if (!userId) return;
  try {
    const q = JSON.parse(localStorage.getItem(SESSION_QUEUE_KEY) || '[]');
    if (!q.length) return;

    let saved = 0;
    const remaining = [];
    for (const s of q) {
      const { error } = await db.sessions.create(
        s.userId || userId, s.mode, s.duration, s.taskId, s.taskName
      );
      if (error) remaining.push(s);
      else       saved++;
    }

    localStorage.setItem(SESSION_QUEUE_KEY, JSON.stringify(remaining));

    if (saved > 0) {
      ui.showToast(`${saved} sesión${saved > 1 ? 'es' : ''} sincronizada${saved > 1 ? 's' : ''} ✓`);
      ui.setSyncState('ok');
    }
    if (remaining.length > 0) ui.setSyncState('error');
    updateSyncBadge();
  } catch (e) { console.warn('[sync] Flush error:', e); }
}

/** Cuántas sesiones hay en cola pendientes. */
export function getQueuedCount() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_QUEUE_KEY) || '[]').length;
  } catch { return 0; }
}

/** Actualiza el badge del botón de sincronización. */
export function updateSyncBadge() {
  const count = getQueuedCount();
  const badge = document.getElementById('sync-badge');
  if (badge) {
    badge.textContent   = count > 0 ? String(count) : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  const btn = document.getElementById('btn-sync');
  if (btn) {
    btn.title = count > 0
      ? `${count} sesiones pendientes de sincronizar`
      : 'Sincronizar ahora';
  }
}
