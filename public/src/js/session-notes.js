/**
 * session-notes.js — Notas de sesión (localStorage).
 * Guarda una nota de texto libre por sesión, indexada por sessionId.
 */

const _PREFIX  = 'fn_snotes_';
const _MAX     = 200; // entradas máximas para no crecer indefinidamente

function _key(userId) { return _PREFIX + userId; }

function _load(userId) {
  try { return JSON.parse(localStorage.getItem(_key(userId)) || '{}'); }
  catch { return {}; }
}

/** Guarda una nota para una sesión concreta. */
export function saveSessionNote(userId, sessionId, note) {
  if (!note?.trim() || !userId || !sessionId) return;
  const notes = _load(userId);
  notes[sessionId] = { note: note.trim(), ts: Date.now() };
  // Limitar tamaño: eliminar las más antiguas si se supera el límite
  const keys = Object.keys(notes);
  if (keys.length > _MAX) {
    keys.sort((a, b) => (notes[a].ts || 0) - (notes[b].ts || 0))
        .slice(0, keys.length - _MAX)
        .forEach(k => delete notes[k]);
  }
  try { localStorage.setItem(_key(userId), JSON.stringify(notes)); } catch (_) {}
}

/** Devuelve la nota de una sesión concreta, o null si no existe. */
export function getSessionNote(userId, sessionId) {
  return _load(userId)[sessionId]?.note || null;
}

/** Devuelve el mapa completo { sessionId → {note, ts} }. */
export function getNotesMap(userId) { return _load(userId); }
